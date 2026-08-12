// Client d'abonnement — appelle l'API /api/abonnement (auth par cookie).

export type Plan = "gratuit" | "pro" | "entreprise";
export type StatutAbonnement = "actif" | "inactif" | "expire";

export interface EtatAbonnement {
  plan: Plan;
  statut: StatutAbonnement;
  renouvellement: string | null;
  stripeConfigure: boolean;
  emailContact: string;
  limites: { dossiersMax: number };
}

async function appel<T>(chemin: string, corps?: unknown, timeoutMs = 15000): Promise<T> {
  const rep = await fetch(chemin, {
    method: corps === undefined ? "GET" : "POST",
    headers: corps === undefined ? undefined : { "Content-Type": "application/json" },
    body: corps === undefined ? undefined : JSON.stringify(corps),
    signal: AbortSignal.timeout(timeoutMs),
    credentials: "same-origin",
  });
  const data = (await rep.json().catch(() => null)) as T | null;
  if (!rep.ok) {
    const erreur = (data as { erreur?: string } | null)?.erreur ?? "Erreur inconnue";
    throw new Error(erreur);
  }
  return data as T;
}

export async function verifierAbonnement(): Promise<EtatAbonnement | null> {
  try {
    return await appel<EtatAbonnement>("/api/abonnement?route=etat", undefined, 8000);
  } catch {
    return null; // non connecté ou API indisponible → invité (démo complète)
  }
}

export async function creerCheckout(plan: "pro" | "entreprise"): Promise<{ url?: string; contact?: boolean; email?: string }> {
  return appel("/api/abonnement?route=checkout", { plan }, 20000);
}

export async function ouvrirPortail(): Promise<{ url: string }> {
  return appel("/api/abonnement?route=portail", {}, 20000);
}

export async function confirmerPaiement(sessionId: string): Promise<{ ok: boolean; plan: Plan; renouvellement: string | null }> {
  return appel(`/api/abonnement?route=confirmer&session_id=${encodeURIComponent(sessionId)}`, undefined, 20000);
}