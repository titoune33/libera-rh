import { randomBytes, scryptSync, timingSafeEqual } from "crypto";
import type { VercelRequest, VercelResponse } from "@vercel/node";

// Helpers partagés d'authentification. Vercel n'expose pas les fichiers
// commençant par « _ » dans le dossier api/ comme routes.

export const AIRTABLE_URL = "https://api.airtable.com/v0";
export const TABLE_UTILISATEURS = "Utilisateurs";
export const TABLE_SESSIONS = "Sessions";
export const COOKIE_SESSION = "equilibre_session";
export const DUREE_SESSION_MS = 30 * 24 * 3600 * 1000; // 30 jours

export type Plan = "gratuit" | "pro" | "entreprise";

/** Limites du plan gratuit (freemium). */
export const LIMITES_GRATUIT = { dossiersMax: 1 } as const;

/** Abonnement d'un utilisateur, lu depuis ses champs Airtable. */
export interface Abonnement {
  plan: Plan;
  stripeCustomerId: string;
  stripeSubscriptionId: string;
  abonnementExpireLe: string;
}

export interface Utilisateur {
  email: string;
  nom: string;
  role: "admin" | "utilisateur";
  provider?: string;
}

/** Emails administrateurs déclarés via ADMIN_EMAILS (séparés par des virgules). */
export function emailsAdmin(): string[] {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
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

function roleDe(roleInconnu: unknown): "admin" | "utilisateur" {
  return String(roleInconnu ?? "").toLowerCase() === "admin" ? "admin" : "utilisateur";
}

/** Met à jour le rôle admin si l'email figure dans ADMIN_EMAILS (auto-promotion). */
async function assurerRoleAdmin(email: string, id: string, roleCourant: "admin" | "utilisateur"): Promise<"admin" | "utilisateur"> {
  if (roleCourant === "admin") return "admin";
  if (!emailsAdmin().includes(email)) return roleCourant;
  const base = baseId();
  const entetes = entetesAirtable();
  if (!base || !entetes) return roleCourant;
  const rep = await fetch(`${AIRTABLE_URL}/${base}/${encodeURIComponent(TABLE_UTILISATEURS)}/${id}`, {
    method: "PATCH",
    headers: entetes,
    body: JSON.stringify({ fields: { role: "admin" } }),
  });
  return rep.ok ? "admin" : roleCourant;
}

export async function trouverUtilisateur(email: string): Promise<{ id: string; nom: string; role: "admin" | "utilisateur" } | null> {
  const emailEchappe = email.replace(/"/g, '\\"');
  const rec = await chercherEnregistrement(TABLE_UTILISATEURS, `{email} = "${emailEchappe}"`);
  if (!rec) return null;
  const role = await assurerRoleAdmin(email, rec.id, roleDe(rec.fields.role));
  return { id: rec.id, nom: String(rec.fields.nom ?? email), role };
}

export async function trouverUtilisateurParProvider(provider: string, providerId: string): Promise<{ id: string; nom: string; email: string; role: "admin" | "utilisateur" } | null> {
  const pid = providerId.replace(/"/g, "");
  const rec = await chercherEnregistrement(TABLE_UTILISATEURS, `AND({provider} = "${provider}", {provider_id} = "${pid}")`);
  if (!rec) return null;
  const email = String(rec.fields.email ?? "");
  const role = await assurerRoleAdmin(email, rec.id, roleDe(rec.fields.role));
  return { id: rec.id, nom: String(rec.fields.nom ?? email), email, role };
}

export async function creerUtilisateur(
  email: string,
  nom: string,
  mdpHash: string,
  extra?: { provider?: string; providerId?: string },
): Promise<{ id: string } | null> {
  const base = baseId();
  const entetes = entetesAirtable();
  if (!base || !entetes) return null;
  const champs: Record<string, unknown> = {
    email,
    nom,
    mot_de_passe: mdpHash,
    cree_le: new Date().toISOString(),
    role: emailsAdmin().includes(email) ? "admin" : "utilisateur",
  };
  if (extra?.provider) champs.provider = extra.provider;
  if (extra?.providerId) champs.provider_id = extra.providerId;
  const rep = await fetch(`${AIRTABLE_URL}/${base}/${encodeURIComponent(TABLE_UTILISATEURS)}`, {
    method: "POST",
    headers: entetes,
    body: JSON.stringify({ records: [{ fields: champs }] }),
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
  return { email, nom: user.nom, role: user.role };
}

/** Utilisateur courant depuis la requête (cookie), ou null. */
export async function utilisateurCourant(req: VercelRequest): Promise<Utilisateur | null> {
  const token = lireCookie(req, COOKIE_SESSION);
  if (!token) return null;
  return utilisateurParToken(token);
}

/** Retourne l'utilisateur courant si connecté ET admin, sinon null. */
export async function utilisateurAdmin(req: VercelRequest): Promise<Utilisateur | null> {
  const user = await utilisateurCourant(req);
  if (!user || user.role !== "admin") return null;
  return user;
}

function planDe(valeur: unknown): Plan {
  const p = String(valeur ?? "").toLowerCase();
  return p === "pro" || p === "entreprise" ? p : "gratuit";
}

/** Lit l'abonnement d'un utilisateur (défaut : plan gratuit). */
export async function lireAbonnement(email: string): Promise<Abonnement> {
  const rec = await chercherEnregistrement(TABLE_UTILISATEURS, `{email} = "${email.replace(/"/g, "")}"`);
  if (!rec) return { plan: "gratuit", stripeCustomerId: "", stripeSubscriptionId: "", abonnementExpireLe: "" };
  const f = rec.fields;
  return {
    plan: planDe(f.plan),
    stripeCustomerId: String(f.stripe_customer_id ?? ""),
    stripeSubscriptionId: String(f.stripe_subscription_id ?? ""),
    abonnementExpireLe: String(f.abonnement_expire_le ?? ""),
  };
}

/** Met à jour les champs d'abonnement de l'utilisateur (PATCH Airtable). */
export async function mettreAJourAbonnement(email: string, champs: Record<string, unknown>): Promise<boolean> {
  const base = baseId();
  const entetes = entetesAirtable();
  if (!base || !entetes) return false;
  const rec = await chercherEnregistrement(TABLE_UTILISATEURS, `{email} = "${email.replace(/"/g, "")}"`);
  if (!rec) return false;
  const rep = await fetch(`${AIRTABLE_URL}/${base}/${encodeURIComponent(TABLE_UTILISATEURS)}/${rec.id}`, {
    method: "PATCH",
    headers: entetes,
    body: JSON.stringify({ fields: champs }),
  });
  return rep.ok;
}

// --------------------------------------------------------------------------
// Email verification & password reset helpers
// --------------------------------------------------------------------------

export const DUREE_RESET_MS = 60 * 60 * 1000; // 1 heure

/** Génère un token de vérification d'email, le stocke dans Airtable, retourne le token. */
export async function genererTokenVerification(email: string): Promise<string> {
  const token = randomBytes(24).toString("hex");
  await mettreAJourChampUtilisateur(email, { token_verification: token });
  return token;
}

/** Vérifie un token de vérification d'email : marque l'email vérifié, retourne l'email ou null. */
export async function verifierTokenVerification(token: string): Promise<string | null> {
  const base = baseId();
  const entetes = entetesAirtable();
  if (!base || !entetes) return null;
  const rec = await chercherEnregistrement(TABLE_UTILISATEURS, `{token_verification} = "${token.replace(/"/g, "")}"`);
  if (!rec) return null;
  const email = String(rec.fields.email ?? "");
  if (!email) return null;
  const rep = await fetch(`${AIRTABLE_URL}/${base}/${encodeURIComponent(TABLE_UTILISATEURS)}/${rec.id}`, {
    method: "PATCH",
    headers: entetes,
    body: JSON.stringify({ fields: { email_verifie: true, token_verification: "" } }),
  });
  return rep.ok ? email : null;
}

/** Génère un token de réinitialisation (expire 1h), le stocke, retourne le token. */
export async function genererTokenReset(email: string): Promise<string> {
  const token = randomBytes(24).toString("hex");
  const expire = new Date(Date.now() + DUREE_RESET_MS).toISOString();
  await mettreAJourChampUtilisateur(email, { token_reset: token, token_reset_expire: expire });
  return token;
}

/** Vérifie un token de reset : retourne l'email si valide, null sinon. */
export async function verifierTokenReset(token: string): Promise<string | null> {
  const rec = await chercherEnregistrement(TABLE_UTILISATEURS, `{token_reset} = "${token.replace(/"/g, "")}"`);
  if (!rec) return null;
  const expire = String(rec.fields.token_reset_expire ?? "");
  if (expire && new Date(expire).getTime() < Date.now()) return null;
  return String(rec.fields.email ?? "") || null;
}

/** Réinitialise le mot de passe d'un utilisateur et efface les tokens de reset. */
export async function reinitialiserMotDePasse(email: string, nouveauMdp: string): Promise<boolean> {
  return mettreAJourChampUtilisateur(email, {
    mot_de_passe: hasherMotDePasse(nouveauMdp),
    token_reset: "",
    token_reset_expire: "",
  });
}

/** PATCH un ou plusieurs champs sur l'enregistrement Airtable de l'utilisateur. */
async function mettreAJourChampUtilisateur(email: string, champs: Record<string, unknown>): Promise<boolean> {
  const base = baseId();
  const entetes = entetesAirtable();
  if (!base || !entetes) return false;
  const rec = await chercherEnregistrement(TABLE_UTILISATEURS, `{email} = "${email.replace(/"/g, "")}"`);
  if (!rec) return false;
  const rep = await fetch(`${AIRTABLE_URL}/${base}/${encodeURIComponent(TABLE_UTILISATEURS)}/${rec.id}`, {
    method: "PATCH",
    headers: entetes,
    body: JSON.stringify({ fields: champs }),
  });
  return rep.ok;
}

export function envoyerErreur(res: VercelResponse, statut: number, erreur: string, extra?: Record<string, unknown>): void {
  res.status(statut).json({ erreur, ...extra });
}
