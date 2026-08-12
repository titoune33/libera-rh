import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Logo } from "./Logo";
import { analyser } from "../lib/engine";
import type { JeuDeDonnees } from "../lib/types";
import { Banner } from "./ui";
import { IconFolder, IconAlert, IconCheck } from "./icons";

interface DossierPartage {
  nom: string;
  description: string;
  creeLe: string;
  sauvegardes: { id: string; nom: string; exercice: string; maj: string; payload: unknown }[];
}

export function PartageView() {
  const [dossier, setDossier] = useState<DossierPartage | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [chargement, setChargement] = useState(true);

  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get("token");
    if (!token) {
      setErreur("Lien de partage invalide (paramètre « token » manquant).");
      setChargement(false);
      return;
    }
    fetch(`/api/partage?token=${encodeURIComponent(token)}`)
      .then(async (rep) => {
        const data = (await rep.json().catch(() => null)) as DossierPartage & { erreur?: string } | null;
        if (!rep.ok || !data) {
          setErreur(data?.erreur ?? "Impossible de charger le dossier partagé.");
          return;
        }
        setDossier(data);
      })
      .catch(() => setErreur("Impossible de contacter l'API de partage."))
      .finally(() => setChargement(false));
  }, []);

  return (
    <div className="partage-page">
      <header className="partage-head">
        <Link to="/" className="partage-brand" aria-label="Équitia — retour à l'accueil">
          <Logo size={30} tagline="Conformité salariale" />
        </Link>
        <Link to="/app" className="btn btn-primary" style={{ minHeight: 38 }}>
          Ouvrir l'application
        </Link>
      </header>

      <main className="partage-main">
        {chargement && <p className="muted">Chargement du dossier partagé…</p>}

        {erreur && (
          <Banner niveau="attention" icon={<IconAlert size={20} />} title="Dossier inaccessible">
            {erreur}
          </Banner>
        )}

        {dossier && (
          <>
            <header className="page-head">
              <p className="landing-eyebrow" style={{ marginBottom: 12 }}>
                <IconFolder size={14} /> Dossier de conformité partagé
              </p>
              <h1>{dossier.nom}</h1>
              <p>
                {dossier.description || "Aucune description fournie."}
                {dossier.creeLe ? ` Créé le ${new Date(dossier.creeLe).toLocaleDateString("fr-FR")}.` : ""}
              </p>
            </header>

            <div className="grid-stats">
              {dossier.sauvegardes.map((s) => {
                const jeu = s.payload && typeof s.payload === "object" ? (s.payload as JeuDeDonnees) : null;
                const res = jeu && Array.isArray(jeu.employes) && jeu.employes.length > 0 ? analyser(jeu.employes) : null;
                return (
                  <div className="stat-card" key={s.id}>
                    <div className="stat-label">{s.nom} · {s.exercice}</div>
                    <div className="stat-value" style={{ fontSize: 22 }}>
                      {res ? `${res.pointsEcart}/100` : "—"}
                    </div>
                    <div className="stat-sub">
                      {res ? (
                        <>
                          {jeu?.employes.length} salariés · écart moyen {res.global.ecartMoyenPct.toFixed(1).replace(".", ",")} %
                        </>
                      ) : (
                        "Données non exploitables"
                      )}
                    </div>
                    <div className="stat-sub muted small">
                      Mis à jour le {s.maj ? new Date(s.maj).toLocaleString("fr-FR") : "—"}
                    </div>
                  </div>
                );
              })}
            </div>

            {dossier.sauvegardes.length === 0 && (
              <Banner niveau="ok" icon={<IconCheck size={20} />} title="Dossier vide">
                Aucun jeu de données n'a encore été ajouté à ce dossier.
              </Banner>
            )}
          </>
        )}
      </main>

      <footer className="partage-foot">
        <p>Données anonymisées · Lecture seule · Généré avec Équitia — transparence salariale (directive (UE) 2023/970)</p>
      </footer>
    </div>
  );
}
