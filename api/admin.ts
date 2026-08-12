import type { VercelRequest, VercelResponse } from "@vercel/node";
import { AIRTABLE_URL, envoyerErreur, utilisateurAdmin } from "./_lib.js";

export const config = { maxDuration: 20 };

// ---------------------------------------------------------------------------
// Routes d'administration consolidées dans une seule fonction serverless
// (limite de 12 fonctions sur le plan Hobby). Les URLs publiques sont
// préservées par des rewrites dans vercel.json :
//   /api/admin/:route → /api/admin?route=:route
// ---------------------------------------------------------------------------

async function compterAirtable(table: string): Promise<number> {
  const token = process.env.AIRTABLE_TOKEN;
  const base = process.env.AIRTABLE_BASE_ID;
  if (!token || !base) return 0;
  // Premier appel pour vérifier l'accès, puis comptage par pagination (borné à 6 requêtes).
  const rep = await fetch(`${AIRTABLE_URL}/${base}/${encodeURIComponent(table)}?fields=id&pageSize=1`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!rep.ok) return 0;
  void rep;
  let total = 0;
  let offset: string | undefined = undefined;
  for (let i = 0; i < 6; i++) {
    const params = new URLSearchParams({ pageSize: "100", fields: "id" });
    if (offset) params.set("offset", offset);
    const r = await fetch(`${AIRTABLE_URL}/${base}/${encodeURIComponent(table)}?${params}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!r.ok) break;
    const d = (await r.json()) as { records?: unknown[]; offset?: string };
    total += d.records?.length ?? 0;
    offset = d.offset;
    if (!offset) break;
  }
  return total;
}

async function activiteRecente(): Promise<{ nom: string; exercice: string; maj: string; email: string }[]> {
  const token = process.env.AIRTABLE_TOKEN;
  const base = process.env.AIRTABLE_BASE_ID;
  if (!token || !base) return [];
  const rep = await fetch(
    `${AIRTABLE_URL}/${base}/${encodeURIComponent("Sauvegardes")}?pageSize=10&sort[0][field]=maj&sort[0][direction]=desc`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  if (!rep.ok) return [];
  const data = (await rep.json()) as { records?: { fields: Record<string, unknown> }[] };
  return (data.records ?? []).map((r) => ({
    nom: String(r.fields.nom ?? "Sans nom"),
    exercice: String(r.fields.exercice ?? ""),
    maj: String(r.fields.maj ?? ""),
    email: String(r.fields.email ?? ""),
  }));
}

async function stats(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    envoyerErreur(res, 405, "Méthode non autorisée. Utilisez GET.");
    return;
  }
  const admin = await utilisateurAdmin(req);
  if (!admin) {
    envoyerErreur(res, 403, "Accès réservé aux administrateurs.", { code: "ADMIN_REQUIS" });
    return;
  }

  const [nbUtilisateurs, nbSauvegardes, nbDossiers, nbSessions, dernieresActivites] = await Promise.all([
    compterAirtable("Utilisateurs"),
    compterAirtable("Sauvegardes"),
    compterAirtable("Dossiers"),
    compterAirtable("Sessions"),
    activiteRecente(),
  ]);

  res.status(200).json({
    compteurs: { utilisateurs: nbUtilisateurs, sauvegardes: nbSauvegardes, dossiers: nbDossiers, sessions: nbSessions },
    integrations: {
      huggingFace: Boolean(process.env.HF_TOKEN),
      airtable: Boolean(process.env.AIRTABLE_TOKEN && process.env.AIRTABLE_BASE_ID),
      google: Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
      github: Boolean(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET),
    },
    activite: dernieresActivites,
  });
}

async function listerAirtable(table: string, filtre: string): Promise<{ id: string; fields: Record<string, unknown> }[]> {
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

async function supprimerRecords(table: string, ids: string[]): Promise<void> {
  const token = process.env.AIRTABLE_TOKEN;
  const base = process.env.AIRTABLE_BASE_ID;
  if (!token || !base || ids.length === 0) return;
  for (let i = 0; i < ids.length; i += 10) {
    const lot = ids.slice(i, i + 10);
    await fetch(`${AIRTABLE_URL}/${base}/${encodeURIComponent(table)}?records=${lot.map(encodeURIComponent).join("&records=")}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
  }
}

async function utilisateurs(req: VercelRequest, res: VercelResponse) {
  const admin = await utilisateurAdmin(req);
  if (!admin) {
    envoyerErreur(res, 403, "Accès réservé aux administrateurs.", { code: "ADMIN_REQUIS" });
    return;
  }

  const token = process.env.AIRTABLE_TOKEN;
  const base = process.env.AIRTABLE_BASE_ID;
  if (!token || !base) {
    envoyerErreur(res, 503, "Airtable non configuré.");
    return;
  }
  const entetes = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

  if (req.method === "GET") {
    const [users, sauvegardes] = await Promise.all([
      listerAirtable("Utilisateurs", "1 = 1"),
      listerAirtable("Sauvegardes", "1 = 1"),
    ]);
    const parEmail = new Map<string, number>();
    for (const s of sauvegardes) {
      const email = String(s.fields.email ?? "").toLowerCase();
      parEmail.set(email, (parEmail.get(email) ?? 0) + 1);
    }
    const liste = users.map((u) => {
      const email = String(u.fields.email ?? "");
      return {
        email,
        nom: String(u.fields.nom ?? ""),
        role: String(u.fields.role ?? "utilisateur") === "admin" ? "admin" : "utilisateur",
        provider: String(u.fields.provider ?? ""),
        creeLe: String(u.fields.cree_le ?? ""),
        sauvegardes: parEmail.get(email.toLowerCase()) ?? 0,
      };
    });
    res.status(200).json({ liste });
    return;
  }

  if (req.method === "PATCH") {
    const { email, role } = (req.body ?? {}) as { email?: string; role?: string };
    const emailCible = (email ?? "").trim().toLowerCase();
    if (!emailCible || (role !== "admin" && role !== "utilisateur")) {
      envoyerErreur(res, 400, "Champs requis : email (cible) et role (admin|utilisateur).");
      return;
    }
    if (emailCible === admin.email) {
      envoyerErreur(res, 400, "Vous ne pouvez pas modifier votre propre rôle.");
      return;
    }
    const rec = (await listerAirtable("Utilisateurs", `{email} = "${emailCible.replace(/"/g, "")}"`))[0];
    if (!rec) {
      envoyerErreur(res, 404, "Utilisateur introuvable.");
      return;
    }
    const rep = await fetch(`${AIRTABLE_URL}/${base}/${encodeURIComponent("Utilisateurs")}/${rec.id}`, {
      method: "PATCH",
      headers: entetes,
      body: JSON.stringify({ fields: { role } }),
    });
    if (!rep.ok) {
      envoyerErreur(res, 502, `Airtable a répondu ${rep.status}.`);
      return;
    }
    res.status(200).json({ ok: true, email: emailCible, role });
    return;
  }

  if (req.method === "DELETE") {
    const { email } = (req.body ?? {}) as { email?: string };
    const emailCible = (email ?? "").trim().toLowerCase();
    if (!emailCible) {
      envoyerErreur(res, 400, "Champ requis : email.");
      return;
    }
    if (emailCible === admin.email) {
      envoyerErreur(res, 400, "Vous ne pouvez pas supprimer votre propre compte.");
      return;
    }
    const [userRec, leursSauvegardes, leursSessions] = await Promise.all([
      listerAirtable("Utilisateurs", `{email} = "${emailCible.replace(/"/g, "")}"`),
      listerAirtable("Sauvegardes", `{email} = "${emailCible.replace(/"/g, "")}"`),
      listerAirtable("Sessions", `{email} = "${emailCible.replace(/"/g, "")}"`),
    ]);
    if (userRec.length === 0) {
      envoyerErreur(res, 404, "Utilisateur introuvable.");
      return;
    }
    await supprimerRecords("Utilisateurs", userRec.map((r) => r.id));
    await supprimerRecords("Sauvegardes", leursSauvegardes.map((r) => r.id));
    await supprimerRecords("Sessions", leursSessions.map((r) => r.id));
    res.status(200).json({ ok: true, supprime: emailCible });
    return;
  }

  envoyerErreur(res, 405, "Méthode non autorisée. Utilisez GET, PATCH ou DELETE.");
}

export default async function admin(req: VercelRequest, res: VercelResponse) {
  const route = String(req.query.route ?? "");
  switch (route) {
    case "stats":
      return stats(req, res);
    case "utilisateurs":
      return utilisateurs(req, res);
    default:
      envoyerErreur(res, 404, "Route d'administration inconnue.");
  }
}
