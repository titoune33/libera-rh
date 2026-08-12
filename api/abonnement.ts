import type { VercelRequest, VercelResponse } from "@vercel/node";
import Stripe from "stripe";
import {
  LIMITES_GRATUIT,
  envoyerErreur,
  lireAbonnement,
  mettreAJourAbonnement,
  utilisateurCourant,
  type Plan,
} from "./_lib.js";
import { baseUrl } from "./_oauth.js";

export const config = { maxDuration: 20 };

// ---------------------------------------------------------------------------
// Abonnement Stripe — freemium (Gratuit) → Pro (49 €/mois) → Entreprise (devis).
// Routes (préservées par des rewrites dans vercel.json) :
//   /api/abonnement?route=tarifs      GET   (public)
//   /api/abonnement?route=etat        GET   (connecté)
//   /api/abonnement?route=checkout    POST  (connecté)
//   /api/abonnement?route=portail     POST  (connecté)
//   /api/abonnement?route=confirmer   GET   (connecté, retour de Stripe)
//   /api/stripe/webhook               POST  (Stripe, via rewrite)
//
// Variables d'environnement requises sur Vercel :
//   STRIPE_SECRET_KEY       clé secrète Stripe (sk_live_…)
//   STRIPE_PRIX_PRO         identifiant du prix récurrent Pro (price_…)
//   STRIPE_WEBHOOK_SECRET   secret de signature du webhook (whsec_…)
// ---------------------------------------------------------------------------

const PRIX_PRO = process.env.STRIPE_PRIX_PRO ?? "";

/** Email de contact commercial (plan Entreprise). */
export const EMAIL_CONTACT = "contact@equitia.fr";

function stripe(): Stripe | null {
  const cle = process.env.STRIPE_SECRET_KEY;
  if (!cle) return null;
  return new Stripe(cle);
}

function stripeConfigure(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY && PRIX_PRO);
}

function planActifStripe(statut: Stripe.Subscription.Status | undefined): boolean {
  return statut === "active" || statut === "trialing";
}

/** Fin de période courante d'un abonnement (ISO), depuis son premier item. */
function finPeriode(sub: Stripe.Subscription): string {
  const fin = sub.items?.data?.[0]?.current_period_end;
  return fin ? new Date(fin * 1000).toISOString() : "";
}

function emailDepuisCustomer(s: Stripe, customerId: string): Promise<string> {
  return s.customers
    .retrieve(customerId)
    .then((c) => (!c.deleted ? c.email ?? "" : ""))
    .catch(() => "");
}

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------

function tarifs(_req: VercelRequest, res: VercelResponse) {
  res.status(200).json({
    stripeConfigure: stripeConfigure(),
    prixPro: PRIX_PRO,
    emailContact: EMAIL_CONTACT,
    plans: [
      { id: "gratuit", nom: "Gratuit", prix: 0, periode: "pour toujours" },
      { id: "pro", nom: "Pro", prix: 49, periode: "/ mois / société" },
      { id: "entreprise", nom: "Entreprise", prix: null, periode: "sur devis" },
    ],
  });
}

async function etat(req: VercelRequest, res: VercelResponse) {
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
  let plan: Plan = abo.plan;
  let expireLe = abo.abonnementExpireLe;

  // Auto-réparation : on recoupe l'état réel côté Stripe quand un abonnement existe.
  const s = stripe();
  if (s && abo.stripeSubscriptionId) {
    try {
      const sub = await s.subscriptions.retrieve(abo.stripeSubscriptionId);
      const actif = planActifStripe(sub.status);
      const prochain = finPeriode(sub);
      const planCalcule: Plan = actif ? (plan === "entreprise" ? "entreprise" : "pro") : "gratuit";
      if (planCalcule !== plan || (prochain && prochain !== expireLe)) {
        await mettreAJourAbonnement(utilisateur.email, {
          plan: planCalcule,
          abonnement_expire_le: actif ? prochain : "",
        });
        plan = planCalcule;
        expireLe = actif ? prochain : "";
      }
    } catch {
      /* on conserve les valeurs stockées */
    }
  }

  const expire = expireLe ? new Date(expireLe).getTime() : 0;
  const statut = plan === "gratuit" ? "inactif" : expire > 0 && expire < Date.now() ? "expire" : "actif";

  res.status(200).json({
    plan,
    statut,
    renouvellement: plan === "gratuit" ? null : expireLe || null,
    stripeConfigure: stripeConfigure(),
    emailContact: EMAIL_CONTACT,
    limites: LIMITES_GRATUIT,
  });
}

async function checkout(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    envoyerErreur(res, 405, "Méthode non autorisée. Utilisez POST.");
    return;
  }
  const utilisateur = await utilisateurCourant(req);
  if (!utilisateur) {
    envoyerErreur(res, 401, "Authentification requise.", { code: "AUTH_REQUIRED" });
    return;
  }
  const s = stripe();
  if (!s || !PRIX_PRO) {
    envoyerErreur(res, 503, "Stripe n'est pas encore activé. Ajoutez STRIPE_SECRET_KEY et STRIPE_PRIX_PRO sur Vercel.", {
      code: "STRIPE_NON_CONFIGURE",
    });
    return;
  }

  const { plan } = (req.body ?? {}) as { plan?: string };
  if (plan !== "pro" && plan !== "entreprise") {
    envoyerErreur(res, 400, "Plan invalide. Choisissez « pro » ou « entreprise ».");
    return;
  }

  const abo = await lireAbonnement(utilisateur.email);

  // Entreprise : pas de checkout public, on redirige vers le contact commercial.
  if (plan === "entreprise") {
    res.status(200).json({ contact: true, email: EMAIL_CONTACT });
    return;
  }

  // Déjà abonné Pro : on renvoie vers le portail de gestion plutôt qu'un second abonnement.
  if (abo.plan === "pro" && abo.stripeCustomerId) {
    try {
      const portail = await s.billingPortal.sessions.create({
        customer: abo.stripeCustomerId,
        return_url: `${baseUrl()}/app?abonnement=1`,
      });
      res.status(200).json({ url: portail.url ?? "" });
      return;
    } catch {
      /* on retombe sur un nouveau checkout */
    }
  }

  try {
    const session = await s.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: PRIX_PRO, quantity: 1 }],
      success_url: `${baseUrl()}/app?succes=1&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl()}/app?annule=1`,
      client_reference_id: utilisateur.email,
      customer_email: utilisateur.email,
      allow_promotion_codes: true,
      metadata: { email: utilisateur.email, plan: "pro" },
    });
    res.status(200).json({ url: session.url ?? "" });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    envoyerErreur(res, 502, `Stripe n'a pas pu créer la session : ${message}`);
  }
}

async function portail(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    envoyerErreur(res, 405, "Méthode non autorisée. Utilisez POST.");
    return;
  }
  const utilisateur = await utilisateurCourant(req);
  if (!utilisateur) {
    envoyerErreur(res, 401, "Authentification requise.", { code: "AUTH_REQUIRED" });
    return;
  }
  const s = stripe();
  if (!s) {
    envoyerErreur(res, 503, "Stripe n'est pas encore activé. Ajoutez STRIPE_SECRET_KEY sur Vercel.", {
      code: "STRIPE_NON_CONFIGURE",
    });
    return;
  }
  const abo = await lireAbonnement(utilisateur.email);
  if (!abo.stripeCustomerId) {
    envoyerErreur(res, 400, "Aucun abonnement actif. Passez à Pro d'abord.", { code: "AUCUN_ABONNEMENT" });
    return;
  }
  try {
    const session = await s.billingPortal.sessions.create({
      customer: abo.stripeCustomerId,
      return_url: `${baseUrl()}/app?abonnement=1`,
    });
    res.status(200).json({ url: session.url ?? "" });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    envoyerErreur(res, 502, `Stripe n'a pas pu ouvrir le portail : ${message}`);
  }
}

async function confirmer(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    envoyerErreur(res, 405, "Méthode non autorisée. Utilisez GET.");
    return;
  }
  const utilisateur = await utilisateurCourant(req);
  if (!utilisateur) {
    envoyerErreur(res, 401, "Authentification requise.", { code: "AUTH_REQUIRED" });
    return;
  }
  const s = stripe();
  if (!s) {
    envoyerErreur(res, 503, "Stripe n'est pas encore activé. Ajoutez STRIPE_SECRET_KEY sur Vercel.", {
      code: "STRIPE_NON_CONFIGURE",
    });
    return;
  }
  const sessionId = String(req.query.session_id ?? "");
  if (!sessionId) {
    envoyerErreur(res, 400, "Paramètre requis : session_id.");
    return;
  }

  try {
    const session = await s.checkout.sessions.retrieve(sessionId, { expand: ["subscription", "customer"] });
    // La session doit appartenir à l'utilisateur courant.
    if (session.client_reference_id !== utilisateur.email && session.customer_email !== utilisateur.email) {
      envoyerErreur(res, 403, "Cette session de paiement n'appartient pas à votre compte.");
      return;
    }
    if (session.payment_status !== "paid") {
      envoyerErreur(res, 402, "Paiement non complété. Réessayez depuis la page Abonnement.");
      return;
    }
    const subId = typeof session.subscription === "string" ? session.subscription : session.subscription?.id ?? "";
    const custId = typeof session.customer === "string" ? session.customer : session.customer?.id ?? "";
    let expire = "";
    if (subId) {
      const sub = await s.subscriptions.retrieve(subId).catch(() => null);
      expire = sub ? finPeriode(sub) : "";
    }
    const ok = await mettreAJourAbonnement(utilisateur.email, {
      plan: "pro",
      stripe_customer_id: custId,
      stripe_subscription_id: subId,
      abonnement_expire_le: expire,
    });
    res.status(200).json({ ok, plan: "pro", renouvellement: expire || null });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    envoyerErreur(res, 502, `Impossible de confirmer le paiement : ${message}`);
  }
}

async function webhook(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    envoyerErreur(res, 405, "Méthode non autorisée. Utilisez POST.");
    return;
  }
  const s = stripe();
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!s || !secret) {
    envoyerErreur(res, 503, "STRIPE_WEBHOOK_SECRET non configuré. Ajoutez-le sur Vercel puis recréez l'endpoint webhook dans Stripe.");
    return;
  }
  const signature = String(req.headers["stripe-signature"] ?? "");
  let event: Stripe.Event;
  try {
    // Vercel parse le corps JSON ; Stripe signe les octets bruts. La sérialisation
    // compacte de Stripe étant stable, JSON.stringify(req.body) reproduit le payload.
    event = s.webhooks.constructEvent(JSON.stringify(req.body), signature, secret);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    envoyerErreur(res, 400, `Signature webhook invalide : ${message}`);
    return;
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const email = session.client_reference_id ?? session.customer_email ?? "";
      if (email) {
        const subId = typeof session.subscription === "string" ? session.subscription : session.subscription?.id ?? "";
        const custId = typeof session.customer === "string" ? session.customer : session.customer?.id ?? "";
        let expire = "";
        if (subId) {
          const sub = await s.subscriptions.retrieve(subId).catch(() => null);
          expire = sub ? finPeriode(sub) : "";
        }
        await mettreAJourAbonnement(email, {
          plan: "pro",
          stripe_customer_id: custId,
          stripe_subscription_id: subId,
          abonnement_expire_le: expire,
        });
      }
      break;
    }
    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      const custId = typeof sub.customer === "string" ? sub.customer : sub.customer?.id ?? "";
      const email = custId ? await emailDepuisCustomer(s, custId) : "";
      if (email) {
        const actif = planActifStripe(sub.status);
        const expire = finPeriode(sub);
        await mettreAJourAbonnement(email, {
          plan: actif ? "pro" : "gratuit",
          stripe_subscription_id: sub.id,
          abonnement_expire_le: actif ? expire : "",
        });
      }
      break;
    }
    case "invoice.payment_failed": {
      const invoice = event.data.object as Stripe.Invoice;
      const custId = typeof invoice.customer === "string" ? invoice.customer : invoice.customer?.id ?? "";
      const email = custId ? await emailDepuisCustomer(s, custId) : "";
      if (email) {
        await mettreAJourAbonnement(email, { plan: "gratuit", abonnement_expire_le: "" });
      }
      break;
    }
    default:
      break;
  }

  res.status(200).json({ received: true });
}

export default async function abonnement(req: VercelRequest, res: VercelResponse) {
  const route = String(req.query.route ?? "");
  switch (route) {
    case "tarifs":
      return tarifs(req, res);
    case "etat":
      return etat(req, res);
    case "checkout":
      return checkout(req, res);
    case "portail":
      return portail(req, res);
    case "confirmer":
      return confirmer(req, res);
    case "webhook":
      return webhook(req, res);
    default:
      envoyerErreur(res, 404, "Route d'abonnement inconnue.");
  }
}
