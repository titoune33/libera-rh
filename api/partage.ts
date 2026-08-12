import type { VercelRequest, VercelResponse } from "@vercel/node";
import { AIRTABLE_URL, envoyerErreur } from "./_lib.js";

export const config = { maxDuration: 20 };

interface DossierPartage {
  nom: string;
  description: string;
  creeLe: string;
  sauvegardes: { id: string; nom: string; exercice: string; maj: string; payload: unknown }[];
}

export default async function partage(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    envoyerErreur(res, 405, "Méthode non autorisée. Utilisez GET.");
    return;
  }
  const token = process.env.AIRTABLE_TOKEN;
  const base = process.env.AIRTABLE_BASE_ID;
  if (!token || !base) {
    envoyerErreur(res, 503, "Stockage non configuré.");
    return;
  }
  const tokenPartage = String(req.query.token ?? req.query.t ?? "").trim();
  if (!tokenPartage) {
    envoyerErreur(res, 400, "Paramètre requis : token.");
    return;
  }
  const entetes = { Authorization: `Bearer ${token}` };

  // Le dossier doit être partagé activement.
  const filtreDossier = encodeURIComponent(`AND({token_partage} = "${tokenPartage.replace(/"/g, "")}", {partage_actif} = 1)`);
  const repDossier = await fetch(`${AIRTABLE_URL}/${base}/${encodeURIComponent("Dossiers")}?filterByFormula=${filtreDossier}&maxRecords=1`, { headers: entetes });
  if (!repDossier.ok) {
    envoyerErreur(res, 502, `Airtable a répondu ${repDossier.status}.`);
    return;
  }
  const dataDossier = (await repDossier.json()) as { records?: { fields: Record<string, unknown> }[] };
  const dossier = dataDossier.records?.[0];
  if (!dossier) {
    envoyerErreur(res, 404, "Dossier partagé introuvable ou partage désactivé.");
    return;
  }

  const email = String(dossier.fields.email ?? "");
  const idDossier = String(dossier.fields.id ?? "");
  const filtreSauvegardes = encodeURIComponent(`AND({email} = "${email.replace(/"/g, "")}", {dossier} = "${idDossier.replace(/"/g, "")}")`);
  const repSauv = await fetch(`${AIRTABLE_URL}/${base}/${encodeURIComponent("Sauvegardes")}?filterByFormula=${filtreSauvegardes}&pageSize=100`, { headers: entetes });
  if (!repSauv.ok) {
    envoyerErreur(res, 502, `Airtable a répondu ${repSauv.status}.`);
    return;
  }
  const dataSauv = (await repSauv.json()) as { records?: { fields: Record<string, unknown> }[] };

  const sauvegardes = (dataSauv.records ?? []).map((rec) => {
    const f = rec.fields;
    let payload: unknown = null;
    if (typeof f.payload === "string") {
      try {
        payload = JSON.parse(f.payload);
      } catch {
        payload = null;
      }
    }
    return {
      id: String(f.id ?? ""),
      nom: String(f.nom ?? "Sans nom"),
      exercice: String(f.exercice ?? ""),
      maj: String(f.maj ?? ""),
      payload,
    };
  });

  const reponse: DossierPartage = {
    nom: String(dossier.fields.nom ?? "Dossier partagé"),
    description: String(dossier.fields.description ?? ""),
    creeLe: String(dossier.fields.cree_le ?? ""),
    sauvegardes,
  };
  res.status(200).json(reponse);
}
