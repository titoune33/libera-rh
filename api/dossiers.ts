import { randomBytes } from "crypto";
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { AIRTABLE_URL, LIMITES_GRATUIT, envoyerErreur, lireAbonnement, utilisateurCourant } from "./_lib.js";

export const config = { maxDuration: 20 };

const TABLE_DOSSIERS = "Dossiers";
const TABLE_SAUVEGARDES = "Sauvegardes";

interface Dossier {
  id: string;
  nom: string;
  description: string;
  partageActif: boolean;
  tokenPartage: string;
  creeLe: string;
  nbSauvegardes: number;
}

async function lireRecords(table: string, filtre: string): Promise<{ id: string; fields: Record<string, unknown> }[]> {
  const token = process.env.AIRTABLE_TOKEN;
  const base = process.env.AIRTABLE_BASE_ID;
  if (!token || !base) return [];
  const rep = await fetch(`${AIRTABLE_URL}/${base}/${encodeURIComponent(table)}?filterByFormula=${encodeURIComponent(filtre)}&pageSize=100`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!rep.ok) return [];
  const data = (await rep.json()) as { records?: { id: string; fields: Record<string, unknown> }[] };
  return data.records ?? [];
}

export default async function dossiers(req: VercelRequest, res: VercelResponse) {
  const utilisateur = await utilisateurCourant(req);
  if (!utilisateur) {
    envoyerErreur(res, 401, "Authentification requise.", { code: "AUTH_REQUIRED" });
    return;
  }

  const token = process.env.AIRTABLE_TOKEN;
  const base = process.env.AIRTABLE_BASE_ID;
  if (!token || !base) {
    envoyerErreur(res, 503, "AIRTABLE_TOKEN / AIRTABLE_BASE_ID non configurés sur Vercel.");
    return;
  }
  const entetes = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
  const email = utilisateur.email;

  if (req.method === "GET") {
    const [dossiersRecs, sauvegardes] = await Promise.all([
      lireRecords(TABLE_DOSSIERS, `{email} = "${email.replace(/"/g, "")}"`),
      lireRecords(TABLE_SAUVEGARDES, `{email} = "${email.replace(/"/g, "")}"`),
    ]);
    const parDossier = new Map<string, number>();
    for (const s of sauvegardes) {
      const d = String(s.fields.dossier ?? "");
      if (d) parDossier.set(d, (parDossier.get(d) ?? 0) + 1);
    }
    const liste: Dossier[] = dossiersRecs.map((rec) => {
      const f = rec.fields;
      const id = String(f.id ?? rec.id);
      return {
        id,
        nom: String(f.nom ?? "Sans nom"),
        description: String(f.description ?? ""),
        partageActif: f.partage_actif === true || f.partage_actif === "true",
        tokenPartage: String(f.token_partage ?? ""),
        creeLe: String(f.cree_le ?? ""),
        nbSauvegardes: parDossier.get(id) ?? 0,
      };
    });
    res.status(200).json({ liste });
    return;
  }

  if (req.method === "POST") {
    const { nom, description } = (req.body ?? {}) as { nom?: string; description?: string };
    const nomNettoye = (nom ?? "").trim();
    if (nomNettoye.length < 2) {
      envoyerErreur(res, 400, "Le nom du dossier doit contenir au moins 2 caractères.");
      return;
    }

    // Freemium : le plan gratuit limite le nombre de dossiers.
    const abo = await lireAbonnement(email);
    if (abo.plan === "gratuit") {
      const existants = await lireRecords(TABLE_DOSSIERS, `{email} = "${email.replace(/"/g, "")}"`);
      if (existants.length >= LIMITES_GRATUIT.dossiersMax) {
        envoyerErreur(res, 403, `Le plan gratuit inclut ${LIMITES_GRATUIT.dossiersMax} dossier. Passez à Pro pour créer plus de dossiers.`, {
          code: "LIMITE_PLAN",
          plan: "gratuit",
        });
        return;
      }
    }
    const id = `dossier-${randomBytes(6).toString("hex")}`;
    const rep = await fetch(`${AIRTABLE_URL}/${base}/${encodeURIComponent(TABLE_DOSSIERS)}`, {
      method: "POST",
      headers: entetes,
      body: JSON.stringify({
        records: [
          {
            fields: {
              id,
              email,
              nom: nomNettoye,
              description: description ?? "",
              token_partage: randomBytes(12).toString("hex"),
              partage_actif: false,
              cree_le: new Date().toISOString(),
            },
          },
        ],
      }),
    });
    if (!rep.ok) {
      envoyerErreur(res, 502, `Airtable a répondu ${rep.status} lors de la création.`);
      return;
    }
    res.status(200).json({ ok: true, id });
    return;
  }

  if (req.method === "PATCH") {
    const { id, nom, description, partage_actif } = (req.body ?? {}) as {
      id?: string;
      nom?: string;
      description?: string;
      partage_actif?: boolean;
    };
    if (!id) {
      envoyerErreur(res, 400, "Champ requis : id.");
      return;
    }
    const rec = (await lireRecords(TABLE_DOSSIERS, `AND({id} = "${id.replace(/"/g, "")}", {email} = "${email.replace(/"/g, "")}")`))[0];
    if (!rec) {
      envoyerErreur(res, 404, "Dossier introuvable ou ne vous appartient pas.");
      return;
    }
    const champs: Record<string, unknown> = {};
    if (nom !== undefined) champs.nom = String(nom).trim() || "Sans nom";
    if (description !== undefined) champs.description = String(description);
    if (partage_actif !== undefined) {
      champs.partage_actif = Boolean(partage_actif);
      if (partage_actif && !rec.fields.token_partage) champs.token_partage = randomBytes(12).toString("hex");
    }
    const rep = await fetch(`${AIRTABLE_URL}/${base}/${encodeURIComponent(TABLE_DOSSIERS)}/${rec.id}`, {
      method: "PATCH",
      headers: entetes,
      body: JSON.stringify({ fields: champs }),
    });
    if (!rep.ok) {
      envoyerErreur(res, 502, `Airtable a répondu ${rep.status} lors de la mise à jour.`);
      return;
    }
    res.status(200).json({ ok: true, id });
    return;
  }

  if (req.method === "DELETE") {
    const { id } = (req.body ?? {}) as { id?: string };
    if (!id) {
      envoyerErreur(res, 400, "Champ requis : id.");
      return;
    }
    const rec = (await lireRecords(TABLE_DOSSIERS, `AND({id} = "${id.replace(/"/g, "")}", {email} = "${email.replace(/"/g, "")}")`))[0];
    if (!rec) {
      envoyerErreur(res, 404, "Dossier introuvable ou ne vous appartient pas.");
      return;
    }
    const rep = await fetch(`${AIRTABLE_URL}/${base}/${encodeURIComponent(TABLE_DOSSIERS)}/${rec.id}`, {
      method: "DELETE",
      headers: entetes,
    });
    if (!rep.ok) {
      envoyerErreur(res, 502, `Airtable a répondu ${rep.status} lors de la suppression.`);
      return;
    }
    res.status(200).json({ ok: true });
    return;
  }

  envoyerErreur(res, 405, "Méthode non autorisée. Utilisez GET, POST, PATCH ou DELETE.");
}
