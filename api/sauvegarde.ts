import type { VercelRequest, VercelResponse } from "@vercel/node";
import { AIRTABLE_URL, envoyerErreur, utilisateurCourant } from "./_lib.js";

export const config = { maxDuration: 20 };

export default async function sauvegarde(req: VercelRequest, res: VercelResponse) {
  const token = process.env.AIRTABLE_TOKEN;
  const base = process.env.AIRTABLE_BASE_ID;
  const table = process.env.AIRTABLE_TABLE ?? "Sauvegardes";

  if (!token || !base) {
    envoyerErreur(res, 503, "AIRTABLE_TOKEN / AIRTABLE_BASE_ID non configurés sur Vercel.");
    return;
  }

  // Authentification requise : chaque sauvegarde est rattachée au compte.
  const utilisateur = await utilisateurCourant(req);
  if (!utilisateur) {
    envoyerErreur(res, 401, "Authentification requise. Connectez-vous pour sauvegarder ou charger vos données.", { code: "AUTH_REQUIRED" });
    return;
  }

  const urlTable = `${AIRTABLE_URL}/${base}/${encodeURIComponent(table)}`;
  const headers = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };

  try {
    if (req.method === "GET") {
      const filtre = encodeURIComponent(`{email} = "${utilisateur.email.replace(/"/g, "")}"`);
      const rep = await fetch(`${urlTable}?filterByFormula=${filtre}&pageSize=100`, { headers });
      if (!rep.ok) {
        envoyerErreur(res, 502, `Airtable a répondu ${rep.status} (vérifiez le token, l'id de base et la table).`);
        return;
      }
      const data = (await rep.json()) as { records?: { id: string; fields: Record<string, unknown> }[] };
      const liste = (data.records ?? []).map((rec) => {
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
          id: String(f.id ?? rec.id),
          nom: String(f.nom ?? "Sans nom"),
          exercice: String(f.exercice ?? ""),
          maj: String(f.maj ?? ""),
          payload,
        };
      });
      res.status(200).json({ liste });
      return;
    }

    if (req.method === "POST") {
      const { id, nom, exercice, payload, dossier } = (req.body ?? {}) as {
        id?: string;
        nom?: string;
        exercice?: string;
        payload?: unknown;
        dossier?: string;
      };
      if (!id || payload === undefined) {
        envoyerErreur(res, 400, "Champs requis : id, payload.");
        return;
      }
      const champs: Record<string, unknown> = {
        id,
        nom: nom ?? "Sans nom",
        exercice: exercice ?? "",
        payload: JSON.stringify(payload),
        maj: new Date().toISOString(),
        email: utilisateur.email,
      };
      if (dossier) champs.dossier = dossier;

      const filtre = encodeURIComponent(`{id} = "${id.replace(/"/g, "")}"`);
      const recherche = await fetch(`${urlTable}?filterByFormula=${filtre}&maxRecords=1`, { headers });
      const trouve = (await recherche.json()) as { records?: { id: string }[] };
      const existant = trouve.records?.[0];

      const corps = existant ? { records: [{ id: existant.id, fields: champs }] } : { records: [{ fields: champs }] };
      const rep = await fetch(urlTable, {
        method: existant ? "PATCH" : "POST",
        headers,
        body: JSON.stringify(corps),
      });
      if (!rep.ok) {
        envoyerErreur(res, 502, `Airtable a répondu ${rep.status} lors de l'écriture.`);
        return;
      }
      const data = (await rep.json()) as { records?: { id: string }[] };
      res.status(200).json({ ok: true, enregistre: data.records?.[0]?.id ?? null, maj: champs.maj });
      return;
    }

    envoyerErreur(res, 405, "Méthode non autorisée. Utilisez GET ou POST.");
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    envoyerErreur(res, 502, `Erreur Airtable : ${message}`);
  }
}
