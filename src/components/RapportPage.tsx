import { useMemo, useState } from "react";
import type { JeuDeDonnees, ResultatAnalyse } from "../lib/types";
import { genererRapportMarkdown, exporterCSV, imprimerRapport } from "../lib/rapport";
import { exporterDocx } from "../lib/exportDocx";
import { exporterXlsx } from "../lib/exportXlsx";
import { Section } from "./ui";
import { AssistantIA } from "./AssistantIA";
import { IconDownload, IconPrint, IconDoc } from "./icons";

export function RapportPage({ jeu, resultat }: { jeu: JeuDeDonnees; resultat: ResultatAnalyse }) {
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
        <button className="btn" onClick={() => exporterDocx(jeu, resultat)}>
          <IconDoc size={16} /> Dossier Word (.docx)
        </button>
        <button className="btn" onClick={() => exporterXlsx(jeu, resultat)}>
          <IconDownload size={16} /> Dossier Excel (.xlsx)
        </button>
        <button className="btn" onClick={() => exporterCSV(resultat)}>
          <IconDownload size={16} /> Écarts (CSV)
        </button>
        <button className="btn" onClick={imprimerRapport}>
          <IconPrint size={16} /> Imprimer / PDF
        </button>
      </div>

      <Section title="Aperçu du rapport">
        <div className="rapport-paper">
          <pre>{markdown}</pre>
        </div>
      </Section>

      <AssistantIA jeu={jeu} resultat={resultat} />
    </>
  );
}
