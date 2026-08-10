import { useEffect, useMemo, useState } from "react";
import type { JeuDeDonnees } from "./lib/types";
import { SAMPLE_DATA } from "./lib/sampleData";
import { analyser } from "./lib/engine";
import { verifierEtatAuth, deconnecter, type Utilisateur, type EtatAuth } from "./lib/authClient";
import { Sidebar } from "./components/Sidebar";
import { Dashboard } from "./components/Dashboard";
import { ImportPage } from "./components/ImportPage";
import { AnalysePage } from "./components/AnalysePage";
import { RapportPage } from "./components/RapportPage";
import { FourchettesPage } from "./components/FourchettesPage";
import { ConformitePage } from "./components/ConformitePage";
import { PlanRattrapagePage } from "./components/PlanRattrapagePage";
import { IndexCompletPage } from "./components/IndexCompletPage";
import { LoginScreen } from "./components/LoginScreen";
import { ExerciceBar } from "./components/ExerciceBar";

export type PageId = "dashboard" | "import" | "analyse" | "rapport" | "fourchettes" | "conformite" | "rattrapage" | "index" | "connexion";

export interface Exercice {
  exercice: string;
  jeu: JeuDeDonnees;
}

export function AppShell() {
  const [page, setPage] = useState<PageId>("dashboard");
  const [auth, setAuth] = useState<EtatAuth>({ connecte: false, utilisateur: null, apiIndisponible: false });

  useEffect(() => {
    let actif = true;
    verifierEtatAuth().then((etat) => {
      if (actif) setAuth(etat);
    });
    return () => {
      actif = false;
    };
  }, []);

  const connecte = (u: Utilisateur) => {
    setAuth({ connecte: true, utilisateur: u, apiIndisponible: false });
    setPage("dashboard");
  };

  const seDeconnecter = async () => {
    try {
      await deconnecter();
    } catch {
      /* silencieux */
    }
    setAuth({ connecte: false, utilisateur: null, apiIndisponible: false });
    setPage("dashboard");
  };
  const [exercices, setExercices] = useState<Exercice[]>([
    { exercice: "2025", jeu: SAMPLE_DATA },
    { exercice: "2024", jeu: { ...SAMPLE_DATA, societe: { ...SAMPLE_DATA.societe, exercice: "2024" } } },
  ]);
  const [exerciceActif, setExerciceActif] = useState(0);

  const actif = exercices[exerciceActif];
  const jeu = actif.jeu;
  const resultat = useMemo(() => analyser(jeu.employes), [jeu]);

  const navigate = (p: PageId) => {
    setPage(p);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const chargerJeu = (nouveau: JeuDeDonnees) => {
    const copie = [...exercices];
    copie[exerciceActif] = { ...copie[exerciceActif], jeu: nouveau };
    setExercices(copie);
  };

  const ajouterExercice = () => {
    const annee = new Date().getFullYear();
    const nouvelle = String(annee);
    const existe = exercices.some((e) => e.exercice === nouvelle);
    if (existe) return;
    const copie = [...exercices, { exercice: nouvelle, jeu: { ...jeu, societe: { ...jeu.societe, exercice: nouvelle } } }];
    setExercices(copie);
    setExerciceActif(copie.length - 1);
    setPage("dashboard");
  };

  return (
    <div className="app-shell">
      <a className="skip-link" href="#contenu">
        Aller au contenu principal
      </a>
      <Sidebar
        page={page}
        onNavigate={navigate}
        effectif={jeu.employes.length}
        utilisateur={auth.utilisateur}
        connecte={auth.connecte}
        apiIndisponible={auth.apiIndisponible}
        onSeConnecter={() => navigate("connexion")}
        onSeDeconnecter={seDeconnecter}
      />
      <main id="contenu" className="main-content" tabIndex={-1}>
        <ExerciceBar
          exercices={exercices}
          actif={exerciceActif}
          onSelect={setExerciceActif}
          onAjouter={ajouterExercice}
        />
        {page === "connexion" && (
          <LoginScreen apiIndisponible={auth.apiIndisponible} onConnecte={connecte} onRetour={() => setPage("dashboard")} />
        )}
        {page === "dashboard" && <Dashboard jeu={jeu} resultat={resultat} onNavigate={navigate} exercices={exercices} exerciceActif={exerciceActif} />}
        {page === "import" && <ImportPage jeu={jeu} onJeuChange={chargerJeu} onNavigate={navigate} utilisateur={auth.utilisateur} apiIndisponible={auth.apiIndisponible} />}
        {page === "analyse" && <AnalysePage jeu={jeu} resultat={resultat} />}
        {page === "rapport" && <RapportPage jeu={jeu} resultat={resultat} />}
        {page === "fourchettes" && <FourchettesPage jeu={jeu} resultat={resultat} />}
        {page === "conformite" && <ConformitePage resultat={resultat} />}
        {page === "rattrapage" && <PlanRattrapagePage jeu={jeu} resultat={resultat} />}
        {page === "index" && <IndexCompletPage jeu={jeu} onNavigate={navigate} />}
      </main>
    </div>
  );
}
