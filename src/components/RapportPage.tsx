import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { JeuDeDonnees, ResultatAnalyse } from "../lib/types";
import { genererRapportMarkdown, exporterCSV, imprimerRapport } from "../lib/rapport";
import { exporterDocx } from "../lib/exportDocx";
import { exporterXlsx } from "../lib/exportXlsx";
import { Section } from "./ui";
import { AssistantIA } from "./AssistantIA";
import { IconDownload, IconPrint, IconDoc } from "./icons";

export function RapportPage({ jeu, resultat, planGratuit }: { jeu: JeuDeDonnees; resultat: ResultatAnalyse; planGratuit?: boolean }) {
  const navigate = useNavigate();
  const [copie, setCopie] = useState(false);
  const markdown = useMemo(() => genererRapportMarkdown(jeu, resultat), [jeu, resultat]);

  const copier = async () => {
    try {
      await navigator.clipboard.writeText(markdown);
      setCopie(true);
      setTimeout(() => setCopie(false), 2000);
    } catch {
      // Presse-papiers indisponible (permissions) : silencieux.
    }
  };

  return (
    <>
      <header className="page-head">
        <h1>Rapport conforme</h1>
        <p>
          Dossier de conformité complet : rapport d'écarts, index d'égalité professionnelle (5 indicateurs) et plan de rattrapage
          chiffré — prêt à être transmis aux représentants du personnel, publié sur le site de l'entreprise ou archivé pour
          l'inspection du travail. Il ne remplace pas un avis juridique.
        </p>
      </header>

      <div className="rapport-actions no-print">
        <button className="btn btn-primary" onClick={copier}>
          <IconDoc size={16} /> {copie ? "Copié !" : "Copier le rapport"}
        </button>
        {planGratuit ? (
          <span className="btn btn-ghost" style={{ opacity: 0.5, cursor: "not-allowed" }} title="Réservé au plan Pro">
            <IconDownload size={16} /> Dossier Word (.docx)
          </span>
        ) : (
          <button className="btn" onClick={() => exporterDocx(jeu, resultat)}>
            <IconDoc size={16} /> Dossier Word (.docx)
          </button>
        )}
        {planGratuit ? (
          <span className="btn btn-ghost" style={{ opacity: 0.5, cursor: "not-allowed" }} title="Réservé au plan Pro">
            <IconDownload size={16} /> Dossier Excel (.xlsx)
          </span>
        ) : (
          <button className="btn" onClick={() => exporterXlsx(jeu, resultat)}>
            <IconDownload size={16} /> Dossier Excel (.xlsx)
          </button>
        )}
        {planGratuit ? (
          <span className="btn btn-ghost" style={{ opacity: 0.5, cursor: "not-allowed" }} title="Réservé au plan Pro">
            <IconDownload size={16} /> Écarts (CSV)
          </span>
        ) : (
          <button className="btn" onClick={() => exporterCSV(resultat)}>
            <IconDownload size={16} /> Écarts (CSV)
          </button>
        )}
        <button className="btn" onClick={imprimerRapport}>
          <IconPrint size={16} /> Imprimer / PDF
        </button>
      </div>

      {planGratuit && (
        <div className="banner" data-niveau="attention" style={{ marginBottom: "var(--space-4)" }}>
          <div className="banner-body">
            <p>
              Les exports sont réservés au plan Pro.{" "}
              <button
                className="btn btn-ghost"
                style={{ display: "inline", padding: "0 4px", minHeight: "auto", fontSize: "inherit", color: "var(--c-primary)", fontWeight: 600, textDecoration: "underline", verticalAlign: "baseline" }}
                onClick={() => navigate("/app?abonnement=1")}
              >
                Passer à Pro — 49 €/mois
              </button>
            </p>
          </div>
        </div>
      )}

      <Section title="Aperçu du rapport">
        <div className="rapport-paper">
          <pre>{markdown}</pre>
        </div>
      </Section>

      <AssistantIA jeu={jeu} resultat={resultat} />
    </>
  );
}
