import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { LogoMark } from "./Logo";
import { IconCheck, IconCard } from "./icons";
import { verifierAbonnement, creerCheckout } from "../lib/abonnementClient";
import type { EtatAbonnement } from "../lib/abonnementClient";

const PLANS = [
  {
    id: "gratuit" as const,
    nom: "Gratuit",
    prix: "0 €",
    periode: "pour toujours",
    cta: "Créer un compte gratuit",
    points: [
      "1 dossier de conformité",
      "Analyse complète des écarts F/H",
      "Index d'égalité /100",
      "Guide de conformité interactif",
      "Données jamais stockées sur le serveur",
    ],
  },
  {
    id: "pro" as const,
    nom: "Pro",
    prix: "49 €",
    periode: "/ mois / société",
    cta: "S'abonner — 49 €/mois",
    populaire: true,
    points: [
      "Dossiers illimités",
      "Exports Word, Excel & CSV",
      "Fourchettes salariales pour les offres",
      "Plan de rattrapage chiffré",
      "Assistant IA & chat",
      "Benchmark sectoriel & multi-exercices",
      "Sauvegarde cloud des données",
    ],
  },
  {
    id: "entreprise" as const,
    nom: "Entreprise",
    prix: "Sur devis",
    periode: "tarification annuelle",
    cta: "Contacter l'équipe",
    points: [
      "Tout le plan Pro",
      "Multi-utilisateurs & rôles",
      "API & connecteurs HRIS",
      "Rapports consolidés multi-entités",
      "Accompagnement juridique dédié",
      "SSO & audit",
    ],
  },
];

export function TarifsPage() {
  const navigate = useNavigate();
  const [abo, setAbo] = useState<EtatAbonnement | null>(null);
  const [chargement, setChargement] = useState<string | null>(null);
  const [erreur, setErreur] = useState("");

  useEffect(() => {
    verifierAbonnement().then(setAbo);
  }, []);

  const connecte = abo !== null;
  const dejaPro = connecte && (abo.plan === "pro" || abo.plan === "entreprise");

  const clicPro = async () => {
    if (!connecte) {
      navigate("/app?plan=pro");
      return;
    }
    if (dejaPro) {
      navigate("/app?abonnement=1");
      return;
    }
    setChargement("Redirection vers Stripe…");
    setErreur("");
    try {
      const result = await creerCheckout("pro");
      if (result.url) {
        window.location.href = result.url;
      } else {
        setErreur("Impossible d'initier le paiement. Stripe est-il configuré ?");
        setChargement(null);
      }
    } catch (e) {
      setErreur(e instanceof Error ? e.message : "Erreur inconnue");
      setChargement(null);
    }
  };

  return (
    <div className="landing tarifs-page">
      <header className="landing-nav">
        <a href="#top" className="landing-brand" aria-label="Équitia — retour à l'accueil">
          <LogoMark size={30} />
          <span>Équitia</span>
        </a>
        <nav className="landing-nav-links" aria-label="Navigation">
          <a href="/#fonctionnalites">Fonctionnalités</a>
          <a href="/#methode">Méthode</a>
          <a href="/#faq">FAQ</a>
        </nav>
        <Link to="/" className="btn landing-nav-cta">
          ← Retour
        </Link>
      </header>

      <main id="top">
        <section className="landing-hero" style={{ paddingBottom: 0 }}>
          <div className="landing-hero-inner">
            <p className="landing-eyebrow">
              <IconCard size={14} />
              Sans engagement, résiliable à tout moment
            </p>
            <h1>
              Des tarifs <span className="landing-gradient">transparents.</span>
            </h1>
            <p className="landing-hero-sub">
              Commencez gratuitement. Passez à Pro quand vous avez besoin des exports, du plan de rattrapage ou de l'assistant IA.
            </p>
          </div>
        </section>

        <section className="landing-section" style={{ paddingTop: "var(--space-5)" }} aria-labelledby="tarifs-titre">
          <div className="landing-tarifs">
            {PLANS.map((plan) => (
              <article className={`landing-tarif${plan.populaire ? " landing-tarif-populaire" : ""}`} key={plan.nom}>
                {plan.populaire && <span className="landing-tarif-badge">Le plus choisi</span>}
                <h3>{plan.nom}</h3>
                <div className="landing-prix">
                  {plan.prix}
                  <span>{plan.periode}</span>
                </div>
                <ul>
                  {plan.points.map((p) => (
                    <li key={p}>
                      <IconCheck size={16} />
                      {p}
                    </li>
                  ))}
                </ul>
                {plan.id === "gratuit" && (
                  <Link to="/app" className="btn">
                    {plan.cta}
                  </Link>
                )}
                {plan.id === "pro" && (
                  <button
                    className="btn btn-primary"
                    onClick={clicPro}
                    disabled={chargement !== null}
                  >
                    {chargement && dejaPro ? chargement : dejaPro ? "Gérer mon abonnement" : chargement || plan.cta}
                  </button>
                )}
                {plan.id === "entreprise" && (
                  <a href="mailto:contact@equitia.fr" className="btn">
                    {plan.cta}
                  </a>
                )}
              </article>
            ))}
          </div>
          {erreur && (
            <div className="banner" data-niveau="attention" style={{ maxWidth: 720, margin: "var(--space-5) auto" }}>
              <div className="banner-body"><p>{erreur}</p></div>
            </div>
          )}
          {abo !== null && !abo.stripeConfigure && (
            <div className="banner" data-niveau="critique" style={{ maxWidth: 720, margin: "var(--space-5) auto" }}>
              <div className="banner-title">💳 Stripe n'est pas encore activé</div>
              <div className="banner-body">
                <p>Ajoutez <strong>STRIPE_SECRET_KEY</strong> et <strong>STRIPE_PRIX_PRO</strong> dans les variables d'environnement sur Vercel pour activer les paiements. D'ici là, le plan Pro n'est pas souscriptable.</p>
              </div>
            </div>
          )}
        </section>
      </main>

      <footer className="landing-footer">
        <div className="landing-footer-inner">
          <div className="landing-footer-brand">
            <LogoMark size={28} />
            <span>Équitia — Transparence salariale</span>
          </div>
          <p>Directive (UE) 2023/970 · Index d'égalité professionnelle · AI Act.</p>
        </div>
      </footer>
    </div>
  );
}