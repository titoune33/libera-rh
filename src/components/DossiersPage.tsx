import { useCallback, useEffect, useState } from "react";
import type { Utilisateur } from "../lib/authClient";
import { Banner, Section, Badge } from "./ui";
import { IconFolder, IconShare, IconCheck, IconAlert, IconInfo } from "./icons";

interface Dossier {
  id: string;
  nom: string;
  description: string;
  partageActif: boolean;
  tokenPartage: string;
  creeLe: string;
  nbSauvegardes: number;
}

async function appel<T>(chemin: string, methode = "GET", corps?: unknown): Promise<T> {
  const rep = await fetch(chemin, {
    method: methode,
    headers: corps === undefined ? undefined : { "Content-Type": "application/json" },
    body: corps === undefined ? undefined : JSON.stringify(corps),
  });
  const data = (await rep.json().catch(() => null)) as T & { erreur?: string };
  if (!rep.ok) {
    throw new Error(data?.erreur ?? `Erreur ${rep.status}`);
  }
  return data;
}

export function DossiersPage({
  utilisateur,
  apiIndisponible,
  planGratuit,
}: {
  utilisateur: Utilisateur | null;
  apiIndisponible: boolean;
  planGratuit?: boolean;
}) {
  const [dossiers, setDossiers] = useState<Dossier[]>([]);
  const [nom, setNom] = useState("");
  const [description, setDescription] = useState("");
  const [erreur, setErreur] = useState<string | null>(null);
  const [message, setMessage] = useState<{ niveau: "ok" | "attention" | "critique"; texte: string } | null>(null);
  const [copie, setCopie] = useState<string | null>(null);
  const [chargement, setChargement] = useState(false);

  const charger = useCallback(async () => {
    if (!utilisateur) return;
    setErreur(null);
    try {
      const data = await appel<{ liste: Dossier[] }>("/api/dossiers");
      setDossiers(data.liste);
    } catch (err) {
      setErreur(err instanceof Error ? err.message : "Erreur inconnue.");
    }
  }, [utilisateur]);

  useEffect(() => {
    void charger();
  }, [charger]);

  const creer = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setErreur(null);
    if (nom.trim().length < 2) {
      setErreur("Donnez un nom au dossier (2 caractères minimum).");
      return;
    }
    setChargement(true);
    try {
      await appel("/api/dossiers", "POST", { nom, description });
      setNom("");
      setDescription("");
      setMessage({ niveau: "ok", texte: "Dossier créé. Sauvegardez des jeux de données puis activez le partage." });
      void charger();
    } catch (err) {
      setErreur(err instanceof Error ? err.message : "Erreur.");
    } finally {
      setChargement(false);
    }
  };

  const basculerPartage = async (d: Dossier) => {
    setMessage(null);
    setErreur(null);
    try {
      await appel("/api/dossiers", "PATCH", { id: d.id, partage_actif: !d.partageActif });
      void charger();
    } catch (err) {
      setErreur(err instanceof Error ? err.message : "Erreur.");
    }
  };

  const copierLien = async (d: Dossier) => {
    const lien = `${window.location.origin}/partage?token=${d.tokenPartage}`;
    try {
      await navigator.clipboard.writeText(lien);
      setCopie(d.id);
      setTimeout(() => setCopie(null), 2000);
    } catch {
      setMessage({ niveau: "attention", texte: `Lien : ${lien}` });
    }
  };

  const supprimer = async (d: Dossier) => {
    if (!window.confirm(`Supprimer le dossier « ${d.nom} » ? Les sauvegardes liées seront conservées mais retirées du dossier.`)) return;
    setMessage(null);
    try {
      await appel("/api/dossiers", "DELETE", { id: d.id });
      setMessage({ niveau: "ok", texte: "Dossier supprimé." });
      void charger();
    } catch (err) {
      setErreur(err instanceof Error ? err.message : "Erreur.");
    }
  };

  if (!utilisateur) {
    return (
      <>
        <header className="page-head">
          <h1>Dossiers & partage</h1>
        </header>
        <Banner niveau="attention" icon={<IconInfo size={20} />} title="Connectez-vous pour créer des dossiers">
          {apiIndisponible
            ? "L'API n'est pas accessible en mode démo locale. Ouvrez la version déployée (freebuf.vercel.app) et connectez-vous."
            : "Créez un compte gratuit ou connectez-vous : vos dossiers de conformité pourront être partagés par lien sécurisé."}
        </Banner>
      </>
    );
  }

  return (
    <>
      <header className="page-head">
        <h1>Dossiers & partage</h1>
        <p>
          Regroupez vos jeux de données par dossier (ex. « Exercice 2025 », « Filiale Lyon ») et partagez un dossier de conformité
          par lien sécurisé — lecture seule, sans compte pour le destinataire.
        </p>
      </header>

      {erreur && (
        <div className="mt-3">
          <Banner niveau="critique" icon={<IconAlert size={20} />} title="Erreur">
            {erreur}
          </Banner>
        </div>
      )}
      {message && (
        <div className="mt-3">
          <Banner niveau={message.niveau} icon={message.niveau === "ok" ? <IconCheck size={20} /> : <IconAlert size={20} />} title="Dossiers">
            {message.texte}
          </Banner>
        </div>
      )}

      {planGratuit && (
        <div className="banner" data-niveau="attention" style={{ marginBottom: "var(--space-4)" }}>
          <div className="banner-body">
            <p>
              Plan gratuit : 1 dossier maximum.{" "}
              <a
                href="/app?abonnement=1"
                style={{ color: "var(--c-primary)", fontWeight: 600, textDecoration: "underline" }}
              >
                Passer à Pro — 49 €/mois
              </a>
            </p>
          </div>
        </div>
      )}

      <Section title="Créer un dossier">
        <form onSubmit={creer} noValidate style={{ maxWidth: 560 }}>
          <div className="field">
            <label htmlFor="dossier-nom">Nom du dossier</label>
            <input
              id="dossier-nom"
              className="input"
              type="text"
              value={nom}
              onChange={(e) => setNom(e.target.value)}
              placeholder="Exercice 2025 — Conformité"
            />
          </div>
          <div className="field">
            <label htmlFor="dossier-desc">Description (facultatif)</label>
            <textarea
              id="dossier-desc"
              className="textarea"
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Contexte du dossier, périmètre, commentaires…"
            />
          </div>
          <button className="btn btn-primary" type="submit" disabled={chargement}>
            <IconFolder size={16} /> {chargement ? "Création…" : "Créer le dossier"}
          </button>
        </form>
      </Section>

      <Section title={`Vos dossiers (${dossiers.length})`}>
        {dossiers.length === 0 && (
          <p className="muted small">
            Aucun dossier pour l'instant. Créez-en un, puis sauvegardez vos jeux de données dans ce dossier depuis « Données &
            import ».
          </p>
        )}
        <div className="dossier-grid">
          {dossiers.map((d) => (
            <article className="dossier-card" key={d.id}>
              <div className="dossier-card-head">
                <span className="dossier-card-icon" aria-hidden="true">
                  <IconFolder size={18} />
                </span>
                <div>
                  <h3>{d.nom}</h3>
                  <div className="muted small">{d.description || "Aucune description"}</div>
                </div>
                <Badge niveau={d.partageActif ? "ok" : "neutral"}>{d.partageActif ? "Partagé" : "Privé"}</Badge>
              </div>
              <div className="dossier-card-meta">
                {d.nbSauvegardes} jeu(x) de données · créé le {d.creeLe ? new Date(d.creeLe).toLocaleDateString("fr-FR") : "—"}
              </div>
              <div className="dossier-card-actions">
                {d.partageActif ? (
                  <button className="btn btn-primary" onClick={() => copierLien(d)}>
                    <IconShare size={15} /> {copie === d.id ? "Lien copié !" : "Copier le lien"}
                  </button>
                ) : (
                  <button className="btn" onClick={() => basculerPartage(d)}>
                    <IconShare size={15} /> Activer le partage
                  </button>
                )}
                {d.partageActif && (
                  <button className="btn" onClick={() => basculerPartage(d)}>
                    Désactiver
                  </button>
                )}
                <button className="btn btn-danger-soft" onClick={() => supprimer(d)}>
                  Supprimer
                </button>
              </div>
            </article>
          ))}
        </div>
      </Section>
    </>
  );
}
