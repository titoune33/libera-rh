import { useEffect, useState } from "react";
import { inscrire, connecter, verifierSocial, envoyerResetMotDePasse, reinitialiserMotDePasse, type Utilisateur } from "../lib/authClient";
import { Logo } from "./Logo";
import { IconInfo } from "./icons";

const IconGoogle = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
    <path fill="#4285F4" d="M23.5 12.27c0-.85-.08-1.66-.22-2.45H12v4.64h6.46a5.53 5.53 0 0 1-2.4 3.63v3h3.88c2.27-2.1 3.56-5.17 3.56-8.82Z" />
    <path fill="#34A853" d="M12 24c3.24 0 5.96-1.08 7.94-2.91l-3.88-3c-1.08.72-2.45 1.15-4.06 1.15-3.13 0-5.78-2.11-6.72-4.96H1.27v3.1A12 12 0 0 0 12 24Z" />
    <path fill="#FBBC05" d="M5.28 14.28a7.2 7.2 0 0 1 0-4.56v-3.1H1.27a12 12 0 0 0 0 10.76l4.01-3.1Z" />
    <path fill="#EA4335" d="M12 4.76c1.76 0 3.35.61 4.6 1.8l3.43-3.43A11.97 11.97 0 0 0 1.27 6.62l4.01 3.1C6.22 6.87 8.87 4.76 12 4.76Z" />
  </svg>
);

const IconGitHub = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M12 2a10 10 0 0 0-3.16 19.49c.5.09.68-.22.68-.48v-1.7c-2.78.6-3.37-1.34-3.37-1.34-.45-1.16-1.11-1.47-1.11-1.47-.9-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.89 1.52 2.34 1.08 2.91.83.09-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.94 0-1.09.39-1.98 1.03-2.68-.1-.25-.45-1.27.1-2.64 0 0 .84-.27 2.75 1.02a9.56 9.56 0 0 1 5 0c1.91-1.3 2.75-1.02 2.75-1.02.55 1.37.2 2.39.1 2.64.64.7 1.03 1.59 1.03 2.68 0 3.84-2.34 4.68-4.57 4.93.36.31.68.92.68 1.85v2.74c0 .27.18.58.69.48A10 10 0 0 0 12 2Z" />
  </svg>
);

type Mode = "connexion" | "inscription" | "oubli" | "reset";

export function LoginScreen({
  apiIndisponible,
  onConnecte,
  onRetour,
}: {
  apiIndisponible: boolean;
  onConnecte: (u: Utilisateur) => void;
  onRetour: () => void;
}) {
  const params = new URLSearchParams(window.location.search);
  const resetToken = params.get("reset") ?? "";
  const [mode, setMode] = useState<Mode>(resetToken ? "reset" : "connexion");
  const [nom, setNom] = useState("");
  const [email, setEmail] = useState("");
  const [mdp, setMdp] = useState("");
  const [resetMdp, setResetMdp] = useState("");
  const [chargement, setChargement] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [social, setSocial] = useState<{ google: boolean; github: boolean }>({ google: false, github: false });
  const [erreurSocial, setErreurSocial] = useState<string | null>(null);

  useEffect(() => {
    if (params.get("auth") === "erreur") {
      setErreurSocial("La connexion sociale a échoué. Réessayez ou utilisez email / mot de passe.");
    }
    verifierSocial().then(setSocial).catch(() => undefined);
  }, []);

  const soumettre = async (e: React.FormEvent) => {
    e.preventDefault();
    setErreur(null);
    setMessage(null);

    if (mode === "oubli") {
      if (!email.trim()) {
        setErreur("Renseignez votre adresse email.");
        return;
      }
      setChargement(true);
      try {
        await envoyerResetMotDePasse(email.trim().toLowerCase());
        setMessage("Si un compte existe avec cette adresse, vous allez recevoir un email de réinitialisation sous quelques minutes.");
        setMode("connexion");
      } catch (err) {
        setErreur(err instanceof Error ? err.message : "Erreur inconnue.");
      } finally {
        setChargement(false);
      }
      return;
    }

    if (mode === "reset") {
      if (!resetMdp || resetMdp.length < 8) {
        setErreur("8 caractères minimum.");
        return;
      }
      setChargement(true);
      try {
        await reinitialiserMotDePasse(resetToken, resetMdp);
        setMessage("Mot de passe réinitialisé ! Connectez-vous avec votre nouveau mot de passe.");
        setMode("connexion");
        // Nettoie l'URL
        window.history.replaceState({}, "", window.location.pathname);
      } catch (err) {
        setErreur(err instanceof Error ? err.message : "Erreur inconnue.");
      } finally {
        setChargement(false);
      }
      return;
    }

    // connexion / inscription
    if (!email.trim() || mdp.length === 0) {
      setErreur("Renseignez votre email et votre mot de passe.");
      return;
    }
    setChargement(true);
    try {
      const u =
        mode === "connexion"
          ? await connecter(email, mdp)
          : await inscrire(nom || email.split("@")[0], email, mdp);
      onConnecte(u);
    } catch (err) {
      setErreur(err instanceof Error ? err.message : "Erreur inconnue.");
    } finally {
      setChargement(false);
    }
  };

  const allerSocial = (provider: "google" | "github") => {
    if (apiIndisponible) {
      setErreurSocial("La connexion sociale nécessite la version déployée (freebuf.vercel.app).");
      return;
    }
    setErreurSocial(null);
    window.location.href = `/api/auth/${provider}`;
  };

  return (
    <div className="login-screen">
      <div className="login-card">
        <div className="login-brand">
          <Logo size={34} tagline="Conformité salariale" />
        </div>

        <h1>
          {mode === "connexion" && "Bon retour parmi nous"}
          {mode === "inscription" && "Créer votre compte"}
          {mode === "oubli" && "Mot de passe oublié"}
          {mode === "reset" && "Nouveau mot de passe"}
        </h1>

        {mode === "connexion" && (
          <p className="muted small" style={{ marginBottom: 20 }}>
            Connectez-vous pour sauvegarder vos dossiers dans le cloud (Airtable) et les retrouver sur tous vos postes.
          </p>
        )}
        {mode === "inscription" && (
          <p className="muted small" style={{ marginBottom: 20 }}>
            Gratuit, sans carte. Vos sauvegardes restent rattachées à votre compte.
          </p>
        )}
        {mode === "oubli" && (
          <p className="muted small" style={{ marginBottom: 20 }}>
            Saisissez votre adresse email. Si un compte existe, vous recevrez un lien de réinitialisation.
          </p>
        )}
        {mode === "reset" && (
          <p className="muted small" style={{ marginBottom: 20 }}>
            Le lien est valable 1 heure. Choisissez un nouveau mot de passe (8 caractères minimum).
          </p>
        )}

        {apiIndisponible && (
          <div className="banner" data-niveau="attention" role="alert" style={{ marginBottom: 16 }}>
            <div className="banner-icon"><IconInfo size={20} /></div>
            <div>
              <div className="banner-title">API indisponible en mode démo locale</div>
              <div className="banner-body">La connexion nécessite la version déployée (freebuf.vercel.app).</div>
            </div>
          </div>
        )}

        {message && (
          <div className="banner" data-niveau="ok" role="status" style={{ marginBottom: 16 }}>
            <div className="banner-body"><p>{message}</p></div>
          </div>
        )}



        {(mode === "connexion" || mode === "inscription") && (
          <div className="login-social" role="group" aria-label="Connexion avec un compte existant">
            <button type="button" className="btn login-social-btn" onClick={() => allerSocial("google")} disabled={!social.google}>
              <IconGoogle />{social.google ? "Continuer avec Google" : "Google (à configurer)"}
            </button>
            <button type="button" className="btn login-social-btn" onClick={() => allerSocial("github")} disabled={!social.github}>
              <IconGitHub />{social.github ? "Continuer avec GitHub" : "GitHub (à configurer)"}
            </button>
          </div>
        )}

        {(mode === "connexion" || mode === "inscription") && (
          <div className="login-divider" role="separator"><span>ou avec email</span></div>
        )}

        {erreurSocial && <div className="error-msg" role="alert">{erreurSocial}</div>}

        {(mode === "connexion" || mode === "inscription") && (
          <div className="login-tabs" role="tablist" aria-label="Connexion ou inscription">
            <button
              type="button" role="tab"
              aria-selected={mode === "connexion"}
              className={mode === "connexion" ? "login-tab login-tab-active" : "login-tab"}
              onClick={() => setMode("connexion")}
            >Connexion</button>
            <button
              type="button" role="tab"
              aria-selected={mode === "inscription"}
              className={mode === "inscription" ? "login-tab login-tab-active" : "login-tab"}
              onClick={() => setMode("inscription")}
            >Inscription</button>
          </div>
        )}

        {mode === "reset" ? (
          <form onSubmit={soumettre} noValidate>
            <div className="field">
              <label htmlFor="reset-mdp">Nouveau mot de passe</label>
              <input id="reset-mdp" className="input" type="password" autoComplete="new-password" required minLength={8} value={resetMdp} onChange={(e) => setResetMdp(e.target.value)} placeholder="8 caractères minimum" />
            </div>
            {erreur && <div className="error-msg" role="alert">{erreur}</div>}
            <button className="btn btn-primary" type="submit" disabled={chargement} style={{ width: "100%", marginTop: 8 }}>
              {chargement ? "Un instant…" : "Réinitialiser mon mot de passe"}
            </button>
          </form>
        ) : mode === "oubli" ? (
          <form onSubmit={soumettre} noValidate>
            <div className="field">
              <label htmlFor="oubli-email">Adresse email</label>
              <input id="oubli-email" className="input" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="vous@entreprise.fr" />
            </div>
            {erreur && <div className="error-msg" role="alert">{erreur}</div>}
            <button className="btn btn-primary" type="submit" disabled={chargement} style={{ width: "100%", marginTop: 8 }}>
              {chargement ? "Un instant…" : "Envoyer le lien de réinitialisation"}
            </button>
            <button className="btn btn-ghost" type="button" style={{ width: "100%", marginTop: 8 }} onClick={() => { setMode("connexion"); setErreur(null); }}>
              ← Retour à la connexion
            </button>
          </form>
        ) : (
          <form onSubmit={soumettre} noValidate>
            {mode === "inscription" && (
              <div className="field">
                <label htmlFor="login-nom">Nom complet</label>
                <input id="login-nom" className="input" type="text" autoComplete="name" value={nom} onChange={(e) => setNom(e.target.value)} placeholder="Marie Dupont" />
              </div>
            )}
            <div className="field">
              <label htmlFor="login-email">Adresse email</label>
              <input id="login-email" className="input" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="vous@entreprise.fr" />
            </div>
            <div className="field">
              <label htmlFor="login-mdp">Mot de passe</label>
              <input id="login-mdp" className="input" type="password" autoComplete={mode === "connexion" ? "current-password" : "new-password"} required minLength={8} value={mdp} onChange={(e) => setMdp(e.target.value)} placeholder={mode === "inscription" ? "8 caractères minimum" : "••••••••"} />
            </div>
            {mode === "connexion" && (
              <button type="button" className="btn btn-ghost" style={{ fontSize: 13, padding: "4px 0", minHeight: 28, display: "block", marginBottom: 4 }} onClick={() => { setMode("oubli"); setErreur(null); }}>
                Mot de passe oublié ?
              </button>
            )}
            {erreur && <div className="error-msg" role="alert">{erreur}</div>}
            <button className="btn btn-primary" type="submit" disabled={chargement} style={{ width: "100%", marginTop: 8 }}>
              {chargement ? "Un instant…" : mode === "connexion" ? "Se connecter" : "Créer mon compte"}
            </button>
          </form>
        )}

        <div className="login-retour">
          <button className="btn btn-ghost" type="button" onClick={onRetour}>
            ← Continuer en mode invité (démo)
          </button>
        </div>
      </div>
    </div>
  );
}