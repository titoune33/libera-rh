import { randomBytes, scryptSync, timingSafeEqual } from "crypto";
import type { VercelRequest, VercelResponse } from "@vercel/node";

// Helpers partagés d'authentification. Vercel n'expose pas les fichiers
// commençant par « _ » dans le dossier api/ comme routes.

export const AIRTABLE_URL = "https://api.airtable.com/v0";
export const TABLE_UTILISATEURS = "Utilisateurs";
export const TABLE_SESSIONS = "Sessions";
export const COOKIE_SESSION = "equilibre_session";
export const DUREE_SESSION_MS = 30 * 24 * 3600 * 1000; // 30 jours

export interface Utilisateur {
  email: string;
  nom: string;
}

export function entetesAirtable(): Record<string, string> | null {
  const token = process.env.AIRTABLE_TOKEN;
  if (!token) return null;
  return { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
}

function baseId(): string | null {
  return process.env.AIRTABLE_BASE_ID ?? null;
}

/** Hashage du mot de passe (scrypt, sel aléatoire) — format « sel:hash ». */
export function hasherMotDePasse(mdp: string): string {
  const sel = randomBytes(16).toString("hex");
  const hash = scryptSync(mdp, sel, 64).toString("hex");
  return `${sel}:${hash}`;
}

export function verifierMotDePasse(mdp: string, stocke: string): boolean {
  const [sel, hash] = stocke.split(":");
  if (!sel || !hash) return false;
  try {
    const calc = scryptSync(mdp, sel, 64);
    return timingSafeEqual(calc, Buffer.from(hash, "hex"));
  } catch {
    return false;
  }
}

export function lireCookie(req: VercelRequest, nom: string): string | null {
  const raw = req.headers.cookie ?? "";
  for (const part of raw.split(";")) {
    const idx = part.indexOf("=");
    if (idx < 0) continue;
    const k = part.slice(0, idx).trim();
    const v = part.slice(idx + 1).trim();
    if (k === nom) return v;
  }
  return null;
}

export function poserCookie(res: VercelResponse, token: string, maxAgeMs: number): void {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  res.setHeader("Set-Cookie", `${COOKIE_SESSION}=${token}; Path=/; HttpOnly; SameSite=Lax${secure}; Max-Age=${Math.floor(maxAgeMs / 1000)}`);
}

export function effacerCookie(res: VercelResponse): void {
  res.setHeader("Set-Cookie", `${COOKIE_SESSION}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`);
}

function encodageFormulaire(filtre: string): string {
  return encodeURIComponent(filtre);
}

/** Recherche un enregistrement Airtable par formule. */
async function chercherEnregistrement(table: string, formule: string): Promise<{ id: string; fields: Record<string, unknown> } | null> {
  const base = baseId();
  const entetes = entetesAirtable();
  if (!base || !entetes) return null;
  const rep = await fetch(`${AIRTABLE_URL}/${base}/${encodeURIComponent(table)}?filterByFormula=${encodageFormulaire(formule)}&maxRecords=1`, { headers: entetes });
  if (!rep.ok) return null;
  const data = (await rep.json()) as { records?: { id: string; fields: Record<string, unknown> }[] };
  return data.records?.[0] ?? null;
}

export async function trouverUtilisateur(email: string): Promise<{ id: string; nom: string } | null> {
  const emailEchappe = email.replace(/"/g, '\\"');
  const rec = await chercherEnregistrement(TABLE_UTILISATEURS, `{email} = "${emailEchappe}"`);
  if (!rec) return null;
  return { id: rec.id, nom: String(rec.fields.nom ?? email) };
}

export async function creerUtilisateur(email: string, nom: string, mdpHash: string): Promise<{ id: string } | null> {
  const base = baseId();
  const entetes = entetesAirtable();
  if (!base || !entetes) return null;
  const rep = await fetch(`${AIRTABLE_URL}/${base}/${encodeURIComponent(TABLE_UTILISATEURS)}`, {
    method: "POST",
    headers: entetes,
    body: JSON.stringify({ records: [{ fields: { email, nom, mot_de_passe: mdpHash, cree_le: new Date().toISOString() } }] }),
  });
  if (!rep.ok) return null;
  const data = (await rep.json()) as { records?: { id: string }[] };
  return data.records?.[0] ? { id: data.records[0].id } : null;
}

export async function creerSession(email: string): Promise<string> {
  const base = baseId();
  const entetes = entetesAirtable();
  if (!base || !entetes) return "";
  const token = randomBytes(32).toString("hex");
  const expireLe = new Date(Date.now() + DUREE_SESSION_MS).toISOString();
  const rep = await fetch(`${AIRTABLE_URL}/${base}/${encodeURIComponent(TABLE_SESSIONS)}`, {
    method: "POST",
    headers: entetes,
    body: JSON.stringify({ records: [{ fields: { token, email, expire_le: expireLe } }] }),
  });
  if (!rep.ok) return "";
  return token;
}

export async function supprimerSession(token: string): Promise<void> {
  const base = baseId();
  const entetes = entetesAirtable();
  if (!base || !entetes) return;
  const rec = await chercherEnregistrement(TABLE_SESSIONS, `{token} = "${token.replace(/"/g, "")}"`);
  if (!rec) return;
  await fetch(`${AIRTABLE_URL}/${base}/${encodeURIComponent(TABLE_SESSIONS)}/${rec.id}`, { method: "DELETE", headers: entetes });
}

/** Résout un token de session en utilisateur (vérifie l'expiration). */
export async function utilisateurParToken(token: string): Promise<Utilisateur | null> {
  if (!token) return null;
  const rec = await chercherEnregistrement(TABLE_SESSIONS, `{token} = "${token.replace(/"/g, "")}"`);
  if (!rec) return null;
  const expireLe = String(rec.fields.expire_le ?? "");
  if (expireLe && new Date(expireLe).getTime() < Date.now()) return null;
  const email = String(rec.fields.email ?? "");
  if (!email) return null;
  const user = await trouverUtilisateur(email);
  if (!user) return null;
  return { email, nom: user.nom };
}

/** Utilisateur courant depuis la requête (cookie), ou null. */
export async function utilisateurCourant(req: VercelRequest): Promise<Utilisateur | null> {
  const token = lireCookie(req, COOKIE_SESSION);
  if (!token) return null;
  return utilisateurParToken(token);
}

export function envoyerErreur(res: VercelResponse, statut: number, erreur: string, extra?: Record<string, unknown>): void {
  res.status(statut).json({ erreur, ...extra });
}
