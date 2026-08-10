import { useState } from "react";
import { inscrire, connecter, type Utilisateur } from "../lib/authClient";
import { IconScale, IconInfo } from "./icons";

export function LoginScreen({
  apiIndisponible,
  onConnecte,
  onRetour,
}: {
  apiIndisponible: boolean;
  onConnecte: (u: Utilisateur) => void;
  onRetour: () => void;
}) {
  const [mode, setMode] = useState<"connexion" | "inscription">("connexion");
  const [nom, setNom] = useState("");
  const [email, setEmail] = useState("");
  const [mdp, setMdp] = useState("");
  const [chargement, setChargement] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  const soumettre = async (e: React.FormEvent) => {
    e.preventDefault();
    setErreur(null);
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

  return (
    <div className="login-screen">
      <div className="login-card">
        <div className="login-brand">
          <span className="brand-logo" aria-hidden="true">
            <IconScale size={18} />
          </span>
          <div>
            <div className="brand-name">Équilibre</div>
            <div className="brand-tag">Transparence salariale</div>
          </div>
        </div>

        <h1>{mode === "connexion" ? "Bon retour parmi nous" : "Créer votre compte"}</h1>
        <p className="muted small" style={{ marginBottom: 20 }}>
          {mode === "connexion"
            ? "Connectez-vous pour sauvegarder vos dossiers dans le cloud (Airtable) et les retrouver sur tous vos postes."
            : "Gratuit, sans carte. Vos sauvegardes restent rattachées à votre compte."}
        </p>

        {apiIndisponible && (
          <div className="banner" data-niveau="attention" role="alert" style={{ marginBottom: 16 }}>
            <div className="banner-icon">
              <IconInfo size={20} />
            </div>
            <div>
              <div className="banner-title">API indisponible en mode démo locale</div>
              <div className="banner-body">
                La connexion nécessite la version déployée (freebuf.vercel.app). Vous pouvez continuer en mode invité.
              </div>
            </div>
          </div>
        )}

        <div className="login-tabs" role="tablist" aria-label="Connexion ou inscription">
          <button
            type="button"
            role="tab"
            aria-selected={mode === "connexion"}
            className={mode === "connexion" ? "login-tab login-tab-active" : "login-tab"}
            onClick={() => setMode("connexion")}
          >
            Connexion
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === "inscription"}
            className={mode === "inscription" ? "login-tab login-tab-active" : "login-tab"}
            onClick={() => setMode("inscription")}
          >
            Inscription
          </button>
        </div>

        <form onSubmit={soumettre} noValidate>
          {mode === "inscription" && (
            <div className="field">
              <label htmlFor="login-nom">Nom complet</label>
              <input
                id="login-nom"
                className="input"
                type="text"
                autoComplete="name"
                value={nom}
                onChange={(e) => setNom(e.target.value)}
                placeholder="Marie Dupont"
              />
            </div>
          )}
          <div className="field">
            <label htmlFor="login-email">Adresse email</label>
            <input
              id="login-email"
              className="input"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="vous@entreprise.fr"
            />
          </div>
          <div className="field">
            <label htmlFor="login-mdp">Mot de passe</label>
            <input
              id="login-mdp"
              className="input"
              type="password"
              autoComplete={mode === "connexion" ? "current-password" : "new-password"}
              required
              minLength={8}
              value={mdp}
              onChange={(e) => setMdp(e.target.value)}
              placeholder={mode === "inscription" ? "8 caractères minimum" : "••••••••"}
            />
          </div>

          {erreur && (
            <div className="error-msg" role="alert">
              {erreur}
            </div>
          )}

          <button className="btn btn-primary" type="submit" disabled={chargement} style={{ width: "100%", marginTop: 8 }}>
            {chargement ? "Un instant…" : mode === "connexion" ? "Se connecter" : "Créer mon compte"}
          </button>
        </form>

        <div className="login-retour">
          <button className="btn btn-ghost" type="button" onClick={onRetour}>
            ← Continuer en mode invité (démo)
          </button>
        </div>
      </div>
    </div>
  );
}
