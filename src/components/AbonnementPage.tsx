import { useCallback, useEffect, useState } from "react";
import type { EtatAbonnement } from "../lib/abonnementClient";
import { confirmerPaiement, creerCheckout, ouvrirPortail } from "../lib/abonnementClient";
import { IconCheck, IconCard, IconLock } from "./icons";

interface Props {
  abo: EtatAbonnement | null;
  connecte: boolean;
  stripeConfigure: boolean;
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
  } catch {
    return iso;
  }
}

const COMPARAISON = [
  { nom: "Dossiers", gratuit: "1 dossier", pro: "Illimités", entreprise: "Illimités" },
  { nom: "Analyse & index", gratuit: "✓", pro: "✓", entreprise: "✓" },
  { nom: "Guide de conformité", gratuit: "✓", pro: "✓", entreprise: "✓" },
  { nom: "Exports Word, Excel, CSV", gratuit: "—", pro: "✓", entreprise: "✓" },
  { nom: "Fourchettes salariales", gratuit: "—", pro: "✓", entreprise: "✓" },
  { nom: "Plan de rattrapage", gratuit: "—", pro: "✓", entreprise: "✓" },
  { nom: "Assistant IA & chat", gratuit: "—", pro: "✓", entreprise: "✓" },
  { nom: "Benchmark & multi-exercices", gratuit: "—", pro: "✓", entreprise: "✓" },
  { nom: "Sauvegarde cloud", gratuit: "—", pro: "✓", entreprise: "✓" },
  { nom: "API & connecteurs HRIS", gratuit: "—", pro: "—", entreprise: "✓" },
  { nom: "Multi-utilisateurs & rôles", gratuit: "—", pro: "—", entreprise: "✓" },
  { nom: "Accompagnement juridique", gratuit: "—", pro: "—", entreprise: "✓" },
];

export function AbonnementPage({ abo, connecte, stripeConfigure }: Props) {
  const [chargement, setChargement] = useState(false);
  const [erreur, setErreur] = useState("");
  const [succes, setSucces] = useState<string | null>(null);
  const [messageAnnule, setMessageAnnule] = useState(false);

  // Vérifie si on revient d'un paiement Stripe
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sessionId = params.get("session_id");
    const succesParam = params.get("succes");
    const annuleParam = params.get("annule");

    if (annuleParam === "1") {
      setMessageAnnule(true);
      // Nettoie l'URL
      window.history.replaceState({}, "", window.location.pathname);
      return;
    }

    if (succesParam === "1" && sessionId && connecte) {
      setChargement(true);
      confirmerPaiement(sessionId)
        .then((result) => {
          if (result.ok) {
            setSucces(`Abonnement ${result.plan === "pro" ? "Pro" : result.plan} activé ! Merci pour votre confiance.`);
          }
          window.history.replaceState({}, "", window.location.pathname);
        })
        .catch((e) => {
          setErreur(e instanceof Error ? e.message : "Erreur de confirmation");
          window.history.replaceState({}, "", window.location.pathname);
        })
        .finally(() => setChargement(false));
    }
  }, [connecte]);

  const clicPro = useCallback(async () => {
    setChargement(true);
    setErreur("");
    try {
      const result = await creerCheckout("pro");
      if (result.url) {
        window.location.href = result.url;
      } else {
        setErreur("Impossible d'initier le paiement.");
        setChargement(false);
      }
    } catch (e) {
      setErreur(e instanceof Error ? e.message : "Erreur inconnue");
      setChargement(false);
    }
  }, []);

  const clicPortail = useCallback(async () => {
    setChargement(true);
    setErreur("");
    try {
      const result = await ouvrirPortail();
      if (result.url) {
        window.location.href = result.url;
      } else {
        setErreur("Impossible d'ouvrir le portail de gestion.");
        setChargement(false);
      }
    } catch (e) {
      setErreur(e instanceof Error ? e.message : "Erreur inconnue");
      setChargement(false);
    }
  }, []);

  const planAffiche = abo?.plan ?? "gratuit";
  const estActif = abo?.statut === "actif";
  const estPayant = planAffiche === "pro" || planAffiche === "entreprise";
  const emailContact = abo?.emailContact ?? "contact@equitia.fr";

  if (!connecte) {
    return (
      <div className="page-head">
        <h1>Abonnement</h1>
        <p>Connectez-vous pour gérer votre abonnement ou passer à Pro.</p>
      </div>
    );
  }

  return (
    <>
      <header className="page-head">
        <h1>
          <IconCard size={22} style={{ verticalAlign: "middle", marginRight: 8 }} />
          Abonnement
        </h1>
      </header>

      {/* Bannière de succès */}
      {succes && (
        <div className="banner" data-niveau="ok" style={{ marginBottom: "var(--space-4)" }}>
          <div className="banner-body"><p>{succes}</p></div>
        </div>
      )}

      {/* Bannière d'annulation */}
      {messageAnnule && (
        <div className="banner" data-niveau="attention" style={{ marginBottom: "var(--space-4)" }}>
          <div className="banner-body"><p>Paiement annulé. Aucun frais n'a été prélevé. Vous pouvez réessayer quand vous voulez.</p></div>
        </div>
      )}

      {/* Bannière d'erreur */}
      {erreur && (
        <div className="banner" data-niveau="critique" style={{ marginBottom: "var(--space-4)" }}>
          <div className="banner-body"><p>{erreur}</p></div>
        </div>
      )}

      {/* Carte du plan actuel */}
      <div className="abo-card" style={{ marginBottom: "var(--space-5)" }}>
        <div className="abo-card-head">
          <span className="abo-badge" data-plan={planAffiche}>
            {planAffiche === "gratuit" ? "Gratuit" : planAffiche === "pro" ? "Pro" : "Entreprise"}
          </span>
          {estPayant && (
            <span className={`badge ${estActif ? "badge-ok" : "badge-danger"}`}>
              {estActif ? "Actif" : "Expiré"}
            </span>
          )}
          {estPayant && abo?.renouvellement && (
            <span style={{ fontSize: 13, color: "var(--c-text-faint)" }}>
              Prochain renouvellement : {formatDate(abo.renouvellement)}
            </span>
          )}
        </div>

        <div className="abo-card-actions">
          {planAffiche === "gratuit" && (
            <p style={{ fontSize: 14, color: "var(--c-text-soft)", margin: "0 0 var(--space-3)" }}>
              Vous utilisez le plan gratuit. Passez à Pro pour débloquer toutes les fonctionnalités (exports, fourchettes, IA…).
            </p>
          )}
          {planAffiche === "gratuit" && (
            <button className="btn btn-primary" onClick={clicPro} disabled={chargement}>
              {chargement ? "Chargement…" : stripeConfigure ? "Passer à Pro — 49 €/mois" : "Stripe non configuré"}
            </button>
          )}
          {planAffiche === "pro" && (
            <button className="btn" onClick={clicPortail} disabled={chargement}>
              {chargement ? "Chargement…" : "Gérer mon abonnement (Stripe)"}
            </button>
          )}
          {planAffiche === "entreprise" && (
            <a href={`mailto:${emailContact}`} className="btn btn-primary">
              Contacter l'équipe commerciale
            </a>
          )}
        </div>
      </div>

      {/* Tableau comparatif */}
      <div className="table-wrap" style={{ marginBottom: "var(--space-5)" }}>
        <table className="table abo-table">
          <thead>
            <tr>
              <th>Fonctionnalité</th>
              <th>Gratuit</th>
              <th className="abo-col-pop">Pro</th>
              <th>Entreprise</th>
            </tr>
          </thead>
          <tbody>
            {COMPARAISON.map((ligne) => (
              <tr key={ligne.nom}>
                <td>{ligne.nom}</td>
                <td>
                  {ligne.gratuit === "✓" ? <IconCheck size={16} style={{ color: "var(--c-ok)" }} /> :
                   ligne.gratuit === "—" ? <IconLock size={14} style={{ color: "var(--c-text-faint)" }} /> :
                   ligne.gratuit}
                </td>
                <td>
                  {ligne.pro === "✓" ? <IconCheck size={16} style={{ color: "var(--c-ok)" }} /> :
                   ligne.pro === "—" ? <IconLock size={14} style={{ color: "var(--c-text-faint)" }} /> :
                   ligne.pro}
                </td>
                <td>
                  {ligne.entreprise === "✓" ? <IconCheck size={16} style={{ color: "var(--c-ok)" }} /> :
                   ligne.entreprise === "—" ? <IconLock size={14} style={{ color: "var(--c-text-faint)" }} /> :
                   ligne.entreprise}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {!stripeConfigure && (
        <div className="banner" data-niveau="attention">
          <div className="banner-title">⚙️ Stripe en cours d'activation</div>
          <div className="banner-body">
            <p>Les souscriptions Pro ne sont pas encore disponibles. Ajoutez les clés Stripe dans les variables d'environnement sur Vercel pour activer les paiements.</p>
          </div>
        </div>
      )}
    </>
  );
}