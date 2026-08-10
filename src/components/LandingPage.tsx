import { Link } from "react-router-dom";
import {
  IconScale,
  IconShield,
  IconChart,
  IconDoc,
  IconTrending,
  IconUpload,
  IconCheck,
  IconAlert,
  IconBuilding,
} from "./icons";

const FEATURES = [
  {
    icon: IconUpload,
    titre: "Import des données de paie",
    texte:
      "Glissez-déposez votre export de paie (CSV). Aucune intégration lourde : Équilibre s'adapte à votre HRIS, quel qu'il soit.",
  },
  {
    icon: IconChart,
    titre: "Analyse des écarts conforme",
    texte:
      "Écart moyen et médian par catégorie professionnelle, analyse à poste comparable, conformes à la directive (UE) 2023/970.",
  },
  {
    icon: IconScale,
    titre: "Fourchettes salariales",
    texte:
      "Générez les fourchettes de rémunération à publier dans vos offres d'emploi (art. 5) — le prérequis pour recruter sans risque.",
  },
  {
    icon: IconDoc,
    titre: "Rapport annuel prêt à publier",
    texte:
      "Rapport conforme en un clic : export Word, Excel, PDF. Transmettez-le aux représentants du personnel et publiez-le sur votre site.",
  },
  {
    icon: IconTrending,
    titre: "Plan de rattrapage chiffré",
    texte:
      "Simulez la correction des écarts : budget annuel, calendrier sous 3 ans, impact sur votre score. Négociez avec des chiffres, pas des impressions.",
  },
  {
    icon: IconShield,
    titre: "Benchmark sectoriel & multi-exercices",
    texte:
      "Positionnez votre écart face à la référence INSEE de votre secteur et suivez l'évolution de votre score année après année.",
  },
];

const ETAPES = [
  {
    num: "01",
    titre: "Importez vos données",
    texte: "Un export de paie CSV, sans préparation. Le modèle est fourni et les erreurs sont détectées ligne par ligne.",
  },
  {
    num: "02",
    titre: "Analysez en quelques secondes",
    texte: "Score d'égalité, écarts par catégorie et à poste comparable, comparaison à votre secteur. Tout est calculé localement.",
  },
  {
    num: "03",
    titre: "Publiez et justifiez",
    texte: "Rapport conforme, fourchettes pour vos offres, plan de rattrapage chiffré. Vous êtes prêt pour l'inspection et les IRP.",
  },
];

const TARIFS = [
  {
    nom: "Découverte",
    prix: "0 €",
    periode: "pour toujours",
    cta: "Ouvrir la démo",
    ctaPrimary: false,
    points: [
      "Jeu de démonstration inclus",
      "Analyse complète des écarts",
      "Rapport conforme (copie)",
      "Jusqu'à 25 salariés",
    ],
  },
  {
    nom: "Conformité",
    prix: "49 €",
    periode: "/ mois / société",
    cta: "Démarrer l'essai de 14 jours",
    ctaPrimary: true,
    populaire: true,
    points: [
      "Jusqu'à 250 salariés",
      "Exports Word, Excel & PDF",
      "Fourchettes salariales",
      "Benchmark sectoriel",
      "Multi-exercices & historique",
    ],
  },
  {
    nom: "ETI & Groupes",
    prix: "Sur devis",
    periode: "tarification annuelle",
    cta: "Parler à un expert",
    ctaPrimary: false,
    points: [
      "Salariés illimités, multi-entités",
      "API et connecteurs HRIS",
      "Rapports consolidés par entité",
      "Accompagnement juridique",
    ],
  },
];

const FAQ = [
  {
    q: "La directive (UE) 2023/970 me concerne-t-elle ?",
    r: "Oui si vous employez des salariés en France ou dans un État membre : elle s'applique depuis le 7 juin 2026 à toutes les entreprises, quelle que soit leur taille, sur l'égalité de rémunération entre femmes et hommes. Les obligations de rapport concernent les entreprises de 100 salariés et plus.",
  },
  {
    q: "Quelles données dois-je fournir ?",
    r: "Un simple export de votre paie : nom (optionnel), genre, catégorie professionnelle, poste, salaire annuel brut équivalent temps plein. Le modèle CSV est téléchargeable depuis l'application, et vos données ne quittent jamais votre navigateur.",
  },
  {
    q: "Équilibre remplace-t-il mon SIRH ou ma paie ?",
    r: "Non, et c'est voulu. Équilibre est un outil de conformité spécialisé, pas un SIRH : il se branche par-dessus vos outils existants et couvre la transparence salariale que les grands SIRH traitent en module annexe.",
  },
  {
    q: "Le rapport généré est-il juridiquement valable ?",
    r: "Le rapport suit la méthodologie de la directive et de l'index français (écarts moyen/médian, postes comparables, base légale citée). Il constitue une base solide de dialogue avec les IRP et l'inspection du travail, mais ne remplace pas un avis juridique pour les cas complexes.",
  },
  {
    q: "Mes données de paie sont-elles en sécurité ?",
    r: "Tout le calcul s'exécute dans votre navigateur : aucune donnée de paie n'est transmise ni stockée sur nos serveurs. Vous gardez la maîtrise totale de vos fichiers.",
  },
];

export function LandingPage() {
  return (
    <div className="landing">
      {/* ---------- Navigation ---------- */}
      <header className="landing-nav">
        <a href="#top" className="landing-brand" aria-label="Équilibre — retour en haut">
          <span className="landing-brand-logo" aria-hidden="true">
            <IconScale size={18} />
          </span>
          <span>Équilibre</span>
        </a>
        <nav className="landing-nav-links" aria-label="Navigation">
          <a href="#fonctionnalites">Fonctionnalités</a>
          <a href="#methode">Méthode</a>
          <a href="#tarifs">Tarifs</a>
          <a href="#faq">FAQ</a>
        </nav>
        <Link to="/app" className="btn btn-primary landing-nav-cta">
          Ouvrir la démo
        </Link>
      </header>

      <main id="top">
        {/* ---------- Hero ---------- */}
        <section className="landing-hero">
          <div className="landing-hero-inner">
            <p className="landing-eyebrow">
              <IconAlert size={14} />
              Directive (UE) 2023/970 en vigueur depuis le 7 juin 2026
            </p>
            <h1>
              La transparence salariale, <span className="landing-gradient">sans douleur.</span>
            </h1>
            <p className="landing-hero-sub">
              Équilibre analyse vos écarts de rémunération, génère votre rapport conforme et vos fourchettes salariales en quelques
              minutes — sans intégration, sans juriste, sans SIRH à remplacer.
            </p>
            <div className="landing-hero-cta">
              <Link to="/app" className="btn btn-primary landing-btn-lg">
                Ouvrir la démo — c'est gratuit
              </Link>
              <a href="#methode" className="btn landing-btn-lg landing-btn-ghost">
                Voir la méthode
              </a>
            </div>
            <p className="landing-hero-note">Aucune donnée de paie ne quitte votre navigateur · Démo en 30 secondes</p>
          </div>

          {/* Mockup produit */}
          <div className="landing-mockup" role="img" aria-label="Aperçu du tableau de bord Équilibre : score d'égalité 90/100, écart moyen de 5,6 %, actions recommandées">
            <div className="mockup-bar">
              <span className="mockup-dot" style={{ background: "#f87171" }} />
              <span className="mockup-dot" style={{ background: "#fbbf24" }} />
              <span className="mockup-dot" style={{ background: "#34d399" }} />
              <span className="mockup-url">app.equilibre.fr — Tableau de bord</span>
            </div>
            <div className="mockup-body">
              <div className="mockup-side">
                <div className="mockup-logo">
                  <IconScale size={14} />
                  Équilibre
                </div>
                <span className="mockup-nav mockup-nav-active">Tableau de bord</span>
                <span className="mockup-nav">Analyse des écarts</span>
                <span className="mockup-nav">Rapport conforme</span>
                <span className="mockup-nav">Fourchettes</span>
                <span className="mockup-nav">Plan de rattrapage</span>
              </div>
              <div className="mockup-main">
                <div className="mockup-head">
                  <div>
                    <div className="mockup-title">Bonjour 👋</div>
                    <div className="mockup-sub">Votre conformité — Exercice 2025</div>
                  </div>
                  <span className="mockup-badge">Conforme ✓</span>
                </div>
                <div className="mockup-cards">
                  <div className="mockup-card">
                    <div className="mockup-ring" aria-hidden="true">
                      <span>90</span>
                    </div>
                    <div className="mockup-card-label">Score d'égalité /100</div>
                  </div>
                  <div className="mockup-card">
                    <div className="mockup-big">5,6 %</div>
                    <div className="mockup-card-label">Écart moyen F/H</div>
                    <div className="mockup-bar-track">
                      <div className="mockup-bar-fill" style={{ width: "62%" }} />
                    </div>
                  </div>
                  <div className="mockup-card">
                    <div className="mockup-big">2,4 M€</div>
                    <div className="mockup-card-label">Masse salariale</div>
                  </div>
                </div>
                <div className="mockup-actions">
                  <span className="mockup-action mockup-action-primary">Générer le rapport</span>
                  <span className="mockup-action">Fourchettes salariales</span>
                </div>
              </div>
            </div>
          </div>

          {/* Bandeau stats */}
          <div className="landing-stats" aria-label="Chiffres clés">
            <div className="landing-stat">
              <strong>7 juin 2026</strong>
              <span>entrée en vigueur de la directive</span>
            </div>
            <div className="landing-stat">
              <strong>&lt; 30 min</strong>
              <span>du fichier de paie au rapport</span>
            </div>
            <div className="landing-stat">
              <strong>0 intégration</strong>
              <span>un simple export CSV suffit</span>
            </div>
            <div className="landing-stat">
              <strong>100 % local</strong>
              <span>vos données ne quittent pas le navigateur</span>
            </div>
          </div>
        </section>

        {/* ---------- Urgence réglementaire ---------- */}
        <section className="landing-band" aria-labelledby="urgence-titre">
          <div className="landing-band-inner">
            <div>
              <h2 id="urgence-titre">Le délai est passé. Le risque, lui, reste.</h2>
              <p>
                Fourchettes dans les offres d'emploi, droit d'information des candidats, rapport annuel, index d'égalité : les
                obligations se sont empilées sans cadre clair. Une entreprise sur deux n'a pas encore d'outil dédié.
              </p>
            </div>
            <div className="landing-band-list">
              <div>
                <IconCheck size={18} />
                <span>Fourchettes salariales dans chaque offre (art. 5)</span>
              </div>
              <div>
                <IconCheck size={18} />
                <span>Information des candidats et salariés (art. 7)</span>
              </div>
              <div>
                <IconCheck size={18} />
                <span>Rapport annuel pour les 100+ salariés (art. 9)</span>
              </div>
              <div>
                <IconCheck size={18} />
                <span>Index d'égalité publié chaque année (FR)</span>
              </div>
            </div>
          </div>
        </section>

        {/* ---------- Fonctionnalités ---------- */}
        <section className="landing-section" id="fonctionnalites" aria-labelledby="features-titre">
          <div className="landing-section-head">
            <p className="landing-eyebrow">Fonctionnalités</p>
            <h2 id="features-titre">Tout ce qu'il faut pour être conforme, rien de plus</h2>
            <p className="landing-section-sub">
              Un outil spécialisé qui couvre exactement le périmètre de la directive — là où les grands SIRH traitent la transparence
              salariale en module annexe.
            </p>
          </div>
          <div className="landing-features">
            {FEATURES.map((f) => {
              const Icon = f.icon;
              return (
                <article className="landing-feature" key={f.titre}>
                  <span className="landing-feature-icon" aria-hidden="true">
                    <Icon size={20} />
                  </span>
                  <h3>{f.titre}</h3>
                  <p>{f.texte}</p>
                </article>
              );
            })}
          </div>
        </section>

        {/* ---------- Méthode ---------- */}
        <section className="landing-section landing-section-alt" id="methode" aria-labelledby="methode-titre">
          <div className="landing-section-head">
            <p className="landing-eyebrow">Méthode</p>
            <h2 id="methode-titre">Conforme en trois étapes</h2>
          </div>
          <div className="landing-etapes">
            {ETAPES.map((e) => (
              <article className="landing-etape" key={e.num}>
                <span className="landing-etape-num">{e.num}</span>
                <h3>{e.titre}</h3>
                <p>{e.texte}</p>
              </article>
            ))}
          </div>
          <div className="landing-methode-note">
            <IconBuilding size={18} />
            <p>
              Méthodologie alignée sur la directive (UE) 2023/970 et l'index d'égalité professionnelle français : écarts moyen et
              médian, analyse à poste comparable, seuil de 75/100 pour le plan de rattrapage.
            </p>
          </div>
        </section>

        {/* ---------- Tarifs ---------- */}
        <section className="landing-section" id="tarifs" aria-labelledby="tarifs-titre">
          <div className="landing-section-head">
            <p className="landing-eyebrow">Tarifs</p>
            <h2 id="tarifs-titre">Un prix simple, sans surprise</h2>
            <p className="landing-section-sub">Démarrez gratuitement avec la démo, passez à Conformité quand vos données sont chargées.</p>
          </div>
          <div className="landing-tarifs">
            {TARIFS.map((t) => (
              <article className={`landing-tarif${t.populaire ? " landing-tarif-populaire" : ""}`} key={t.nom}>
                {t.populaire && <span className="landing-tarif-badge">Le plus choisi</span>}
                <h3>{t.nom}</h3>
                <div className="landing-prix">
                  {t.prix}
                  <span>{t.periode}</span>
                </div>
                <ul>
                  {t.points.map((p) => (
                    <li key={p}>
                      <IconCheck size={16} />
                      {p}
                    </li>
                  ))}
                </ul>
                <Link to="/app" className={`btn ${t.ctaPrimary ? "btn-primary" : ""}`}>
                  {t.cta}
                </Link>
              </article>
            ))}
          </div>
        </section>

        {/* ---------- FAQ ---------- */}
        <section className="landing-section landing-section-alt" id="faq" aria-labelledby="faq-titre">
          <div className="landing-section-head">
            <p className="landing-eyebrow">FAQ</p>
            <h2 id="faq-titre">Questions fréquentes</h2>
          </div>
          <div className="landing-faq">
            {FAQ.map((item) => (
              <details className="landing-faq-item" key={item.q}>
                <summary>{item.q}</summary>
                <p>{item.r}</p>
              </details>
            ))}
          </div>
        </section>

        {/* ---------- CTA final ---------- */}
        <section className="landing-cta">
          <h2>Votre rapport conforme dans 30 minutes.</h2>
          <p>Testez avec le jeu de démonstration, sans créer de compte, sans donner d'email.</p>
          <Link to="/app" className="btn btn-primary landing-btn-lg">
            Ouvrir la démo gratuite
          </Link>
        </section>
      </main>

      <footer className="landing-footer">
        <div className="landing-footer-inner">
          <div className="landing-footer-brand">
            <span className="landing-brand-logo" aria-hidden="true">
              <IconScale size={16} />
            </span>
            <span>Équilibre — Transparence salariale</span>
          </div>
          <p>Directive (UE) 2023/970 · Index d'égalité professionnelle · AI Act. Les rapports générés ne remplacent pas un avis juridique.</p>
          <p className="landing-footer-legal">© 2026 Équilibre. Démo construite avec React, TypeScript et Vite.</p>
        </div>
      </footer>
    </div>
  );
}
