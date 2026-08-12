import { randomBytes } from "crypto";
import type { VercelRequest, VercelResponse } from "@vercel/node";
import {
  DUREE_SESSION_MS,
  creerSession,
  creerUtilisateur,
  poserCookie,
  trouverUtilisateurParProvider,
} from "./_lib.js";

// Helpers partagés de connexion sociale (OAuth 2.0 — Google, GitHub).
// Les identifiants applicatifs sont fournis par les variables d'environnement
// GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET / GITHUB_CLIENT_ID /
// GITHUB_CLIENT_SECRET, et l'URL publique par BASE_URL.

export const COOKIE_STATE = "oauth_state";
export const DUREE_STATE_MS = 10 * 60 * 1000; // 10 min

export function baseUrl(): string {
  return process.env.BASE_URL ?? "https://freebuf.vercel.app";
}

export function redirectUri(provider: "google" | "github"): string {
  return `${baseUrl()}/api/auth/${provider}/callback`;
}

export function poserEtatOauth(res: VercelResponse): string {
  const state = randomBytes(24).toString("hex");
  res.setHeader(
    "Set-Cookie",
    `${COOKIE_STATE}=${state}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${Math.floor(DUREE_STATE_MS / 1000)}`,
  );
  return state;
}

export function verifierEtatOauth(req: VercelRequest): boolean {
  const reqState = String(req.query.state ?? "");
  const cookieState = (req.headers.cookie ?? "")
    .split(";")
    .map((p) => p.trim())
    .find((p) => p.startsWith(`${COOKIE_STATE}=`));
  if (!reqState || !cookieState) return false;
  return reqState === cookieState.slice(COOKIE_STATE.length + 1);
}

/**
 * Crée (ou retrouve) l'utilisateur social, ouvre une session et pose le cookie.
 * Retourne l'utilisateur { email, nom, role } ou null en cas d'échec.
 */
export async function connecterOuCreerSocial(
  res: VercelResponse,
  email: string,
  nom: string,
  provider: "google" | "github",
  providerId: string,
): Promise<{ email: string; nom: string; role: "admin" | "utilisateur" } | null> {
  if (!email || !providerId) return null;
  const emailNettoye = email.trim().toLowerCase();

  const existant = await trouverUtilisateurParProvider(provider, providerId);
  let cible: { email: string; nom: string; role: "admin" | "utilisateur" } | null = existant
    ? { email: existant.email, nom: existant.nom, role: existant.role }
    : null;

  if (!cible) {
    const cree = await creerUtilisateur(emailNettoye, nom, "", { provider, providerId });
    if (!cree) return null;
    const rec = await trouverUtilisateurParProvider(provider, providerId);
    if (!rec) return null;
    cible = { email: rec.email, nom: rec.nom, role: rec.role };
  }

  const token = await creerSession(cible.email);
  if (!token) return null;
  poserCookie(res, token, DUREE_SESSION_MS);
  return cible;
}

/** Termine le flux OAuth : redirige vers l'app avec le résultat. */
export function finaliserOAuth(res: VercelResponse, ok: boolean): void {
  res.redirect(302, `${baseUrl()}/app?auth=${ok ? "ok" : "erreur"}`);
}
