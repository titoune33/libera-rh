export interface Utilisateur {
  nom: string;
  email: string;
}

export interface EtatAuth {
  connecte: boolean;
  utilisateur: Utilisateur | null;
  /** true si l'API d'auth est injoignable (mode démo locale, dev). */
  apiIndisponible: boolean;
}

async function appel<T>(chemin: string, corps?: unknown, timeoutMs = 10000): Promise<T> {
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

export async function verifierEtatAuth(): Promise<EtatAuth> {
  try {
    const data = await appel<{ connecte: boolean; utilisateur: Utilisateur | null }>("/api/auth/etat", undefined, 3000);
    return { connecte: data.connecte, utilisateur: data.utilisateur, apiIndisponible: false };
  } catch {
    // API injoignable (dev local, pas de /api) : mode invité.
    return { connecte: false, utilisateur: null, apiIndisponible: true };
  }
}

export async function inscrire(nom: string, email: string, motDePasse: string): Promise<Utilisateur> {
  const data = await appel<{ utilisateur: Utilisateur }>("/api/auth/inscription", { nom, email, motDePasse }, 20000);
  return data.utilisateur;
}

export async function connecter(email: string, motDePasse: string): Promise<Utilisateur> {
  const data = await appel<{ utilisateur: Utilisateur }>("/api/auth/connexion", { email, motDePasse }, 20000);
  return data.utilisateur;
}

export async function deconnecter(): Promise<void> {
  await appel<{ ok: boolean }>("/api/auth/deconnexion", {});
}
