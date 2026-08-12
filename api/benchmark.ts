import { createHash, randomBytes } from "crypto";
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { AIRTABLE_URL, envoyerErreur, lireAbonnement, utilisateurCourant } from "./_lib.js";

export const config = { maxDuration: 20 };

// ---------------------------------------------------------------------------
// Benchmark salarial communautaire (freemium) :
//   /api/benchmark?route=apercu      GET   (public)     — nombre de points collectés
//   /api/benchmark?route=soumettre   POST  (connecté)   — contribution anonyme
//   /api/benchmark?route=stats       GET   (connecté)   — statistiques agrégées
//
// Les points sont stockés dans la table Airtable « Sauvegardes » en réutilisant
// uniquement des champs existants (aucun schéma à préparer) :
//   id       = « bench-… » (marqueur) · nom = poste · exercice = hash de l'email
//   payload  = { salaire, anciennete, region } · maj = date de contribution
// Aucune donnée personnelle n'est stockée : jamais d'email ni de nom.
// ---------------------------------------------------------------------------

const TABLE = process.env.AIRTABLE_TABLE ?? "Sauvegardes";
/** Points de contribution maximum par jour et par compte (anti-spam). */
const QUOTA_JOURNALIER = 10;

type RegionBenchmark = "province" | "idf";

interface PointBenchmark {
  poste: string;
  salaire: number;
  anciennete: number;
  region: RegionBenchmark;
}

interface RecordBenchmark extends PointBenchmark {
  source: string;
  creeLe: string;
}

function normaliserPoste(poste: string): string {
  return poste
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function hashSource(email: string): string {
  return createHash("sha256").update(email).digest("hex").slice(0, 16);
}

function estValide(p: unknown): p is PointBenchmark {
  if (!p || typeof p !== "object") return false;
  const x = p as Partial<PointBenchmark>;
  return (
    typeof x.poste === "string" &&
    x.poste.trim().length >= 2 &&
    typeof x.salaire === "number" &&
    Number.isFinite(x.salaire) &&
    x.salaire > 0 &&
    x.salaire < 5_000_000 &&
    typeof x.anciennete === "number" &&
    Number.isFinite(x.anciennete) &&
    x.anciennete >= 0 &&
    x.anciennete < 60 &&
    (x.region === "province" || x.region === "idf")
  );
}

async function lireBenchmarks(): Promise<RecordBenchmark[]> {
  const token = process.env.AIRTABLE_TOKEN;
  const base = process.env.AIRTABLE_BASE_ID;
  if (!token || !base) return [];
  const url = `${AIRTABLE_URL}/${base}/${encodeURIComponent(TABLE)}`;
  const entetes = { Authorization: `Bearer ${token}` };
  const resultats: RecordBenchmark[] = [];
  let offset = "";
  for (let i = 0; i < 30; i++) {
    const suffixe = offset ? `?offset=${encodeURIComponent(offset)}&pageSize=100` : "?pageSize=100";
    const rep = await fetch(url + suffixe, { headers: entetes });
    if (!rep.ok) break;
    const data = (await rep.json()) as { records?: { fields: Record<string, unknown> }[]; offset?: string };
    for (const rec of data.records ?? []) {
      const f = rec.fields;
      if (!String(f.id ?? "").startsWith("bench-")) continue;
      let payload: { salaire?: unknown; anciennete?: unknown; region?: unknown } = {};
      if (typeof f.payload === "string") {
        try {
          payload = JSON.parse(f.payload) as typeof payload;
        } catch {
          payload = {};
        }
      }
      const salaire = Number(payload.salaire ?? 0);
      const anciennete = Number(payload.anciennete ?? 0);
      if (!Number.isFinite(salaire) || salaire <= 0) continue;
      resultats.push({
        poste: normaliserPoste(String(f.nom ?? "")),
        salaire,
        anciennete: Number.isFinite(anciennete) ? anciennete : 0,
        region: payload.region === "idf" ? "idf" : "province",
        source: String(f.exercice ?? ""),
        creeLe: String(f.maj ?? ""),
      });
    }
    if (!data.offset) break;
    offset = data.offset;
  }
  return resultats;
}

function percentiles(valeurs: number[]): { p25: number; p50: number; p75: number } {
  const tri = [...valeurs].sort((a, b) => a - b);
  const at = (q: number) => tri[Math.min(tri.length - 1, Math.max(0, Math.floor((tri.length - 1) * q)))];
  return { p25: at(0.25), p50: at(0.5), p75: at(0.75) };
}

interface PosteAgrege {
  poste: string;
  region: RegionBenchmark;
  effectif: number;
  p25: number;
  p50: number;
  p75: number;
}

function agreger(records: RecordBenchmark[], region: RegionBenchmark | null): PosteAgrege[] {
  const groupes = new Map<string, { poste: string; region: RegionBenchmark; salaires: number[] }>();
  for (const r of records) {
    if (region && r.region !== region) continue;
    if (!r.poste) continue;
    const cle = `${r.poste}|${r.region}`;
    const g = groupes.get(cle) ?? { poste: r.poste, region: r.region, salaires: [] };
    g.salaires.push(r.salaire);
    groupes.set(cle, g);
  }
  return [...groupes.values()]
    .map((g) => {
      const p = percentiles(g.salaires);
      return { poste: g.poste, region: g.region, effectif: g.salaires.length, p25: p.p25, p50: p.p50, p75: p.p75 };
    })
    .filter((g) => g.effectif >= 3)
    .sort((a, b) => b.effectif - a.effectif);
}

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------

async function apercu(_req: VercelRequest, res: VercelResponse) {
  const records = await lireBenchmarks();
  const postes = new Set(records.map((r) => r.poste).filter(Boolean));
  res.status(200).json({ points: records.length, postes: postes.size });
}

async function soumettre(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    envoyerErreur(res, 405, "Méthode non autorisée. Utilisez POST.");
    return;
  }
  const utilisateur = await utilisateurCourant(req);
  if (!utilisateur) {
    envoyerErreur(res, 401, "Authentification requise. Connectez-vous pour contribuer au benchmark.", { code: "AUTH_REQUIRED" });
    return;
  }
  const token = process.env.AIRTABLE_TOKEN;
  const base = process.env.AIRTABLE_BASE_ID;
  if (!token || !base) {
    envoyerErreur(res, 503, "AIRTABLE_TOKEN / AIRTABLE_BASE_ID non configurés sur Vercel.");
    return;
  }

  const { points } = (req.body ?? {}) as { points?: unknown };
  if (!Array.isArray(points) || points.length === 0) {
    envoyerErreur(res, 400, "Aucun point reçu. Envoyez au moins un point { poste, salaire, anciennete, region }.");
    return;
  }
  const valides = points.filter(estValide);
  if (valides.length === 0) {
    envoyerErreur(res, 400, "Aucun point valide : vérifiez le poste (2+ caractères), le salaire annuel (0 < salaire < 5 M€) et la région (province|idf).");
    return;
  }
  if (valides.length > 200) {
    envoyerErreur(res, 400, "Trop de points dans une contribution (maximum 200).");
    return;
  }

  const source = hashSource(utilisateur.email);
  const aujourdhui = new Date().toISOString().slice(0, 10);
  const records = await lireBenchmarks();
  const dejaEnvoyes = records.filter((r) => r.source === source && r.creeLe.startsWith(aujourdhui)).length;
  if (dejaEnvoyes + valides.length > QUOTA_JOURNALIER) {
    envoyerErreur(res, 403, `Quota journalier atteint (${QUOTA_JOURNALIER} points/jour par compte). Revenez demain pour contribuer à nouveau.`, {
      code: "QUOTA_ATTENT",
      quota: { envoyes: dejaEnvoyes, max: QUOTA_JOURNALIER },
    });
    return;
  }

  const urlTable = `${AIRTABLE_URL}/${base}/${encodeURIComponent(TABLE)}`;
  const entetes = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
  for (let i = 0; i < valides.length; i += 10) {
    const lot = valides.slice(i, i + 10);
    const rep = await fetch(urlTable, {
      method: "POST",
      headers: entetes,
      body: JSON.stringify({
        records: lot.map((p) => ({
          fields: {
            id: `bench-${randomBytes(8).toString("hex")}`,
            nom: p.poste.trim(),
            exercice: source,
            payload: JSON.stringify({ salaire: p.salaire, anciennete: p.anciennete, region: p.region }),
            maj: new Date().toISOString(),
          },
        })),
      }),
    });
    if (!rep.ok) {
      const corps = await rep.text().catch(() => "");
      envoyerErreur(res, 502, `Airtable a répondu ${rep.status} lors de l'enregistrement des points : ${corps.slice(0, 300)}`);
      return;
    }
  }
  res.status(200).json({ ok: true, envoyes: valides.length, quotaRestant: QUOTA_JOURNALIER - dejaEnvoyes - valides.length });
}

async function stats(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    envoyerErreur(res, 405, "Méthode non autorisée. Utilisez GET.");
    return;
  }
  const utilisateur = await utilisateurCourant(req);
  if (!utilisateur) {
    envoyerErreur(res, 401, "Authentification requise.", { code: "AUTH_REQUIRED" });
    return;
  }
  const abo = await lireAbonnement(utilisateur.email);
  const regionParam = String(req.query.region ?? "");
  const region: RegionBenchmark | null = regionParam === "idf" ? "idf" : regionParam === "province" ? "province" : null;

  const records = await lireBenchmarks();
  const totalPoints = records.length;
  const totalPostes = new Set(records.map((r) => r.poste).filter(Boolean)).size;
  const medianeGlobale = records.length ? percentiles(records.map((r) => r.salaire)).p50 : null;
  const source = hashSource(utilisateur.email);
  const aujourdhui = new Date().toISOString().slice(0, 10);
  const envoyesAujourdhui = records.filter((r) => r.source === source && r.creeLe.startsWith(aujourdhui)).length;

  const estPro = abo.plan === "pro" || abo.plan === "entreprise";

  if (!estPro) {
    const postesTous = agreger(records, null);
    const top = postesTous.slice(0, 3).map((t) => ({ poste: t.poste, effectif: t.effectif, mediane: t.p50 }));
    res.status(200).json({
      plan: "gratuit",
      totalPoints,
      totalPostes,
      medianeGlobale,
      topPostes: top,
      quota: { envoyes: envoyesAujourdhui, max: QUOTA_JOURNALIER },
    });
    return;
  }

  res.status(200).json({
    plan: "pro",
    totalPoints,
    totalPostes,
    medianeGlobale,
    region: region ?? "toutes",
    postes: agreger(records, region),
    quota: { envoyes: envoyesAujourdhui, max: QUOTA_JOURNALIER },
  });
}

export default async function benchmark(req: VercelRequest, res: VercelResponse) {
  const route = String(req.query.route ?? "");
  switch (route) {
    case "apercu":
      return apercu(req, res);
    case "soumettre":
      return soumettre(req, res);
    case "stats":
      return stats(req, res);
    default:
      envoyerErreur(res, 404, "Route de benchmark inconnue.");
  }
}
