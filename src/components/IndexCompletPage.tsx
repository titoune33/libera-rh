import type { JeuDeDonnees } from "../lib/types";
import { calculerIndex } from "../lib/indexFrancais";
import type { PageId } from "../AppShell";
import { Section, StatCard, Badge, Banner, Bar } from "./ui";
import { IconAlert, IconCheck, IconInfo } from "./icons";

export function IndexCompletPage({ jeu, onNavigate }: { jeu: JeuDeDonnees; onNavigate: (p: PageId) => void }) {
  const index = calculerIndex(jeu.employes);
  const seuil = index.total >= 75;

  return (
    <>
      <header className="page-head">
        <h1>Index d'égalité professionnelle</h1>
        <p>
          Calcul complet et conforme au Code du travail (L. 1142-8, D. 1142-2 s.) : les 5 indicateurs pondérés (40 + 20 + 15 + 15 + 10
          points), total ramené sur 100, à publier chaque année au plus tard le 1er mars. Exercice {jeu.societe.exercice} —{" "}
          {index.methode}.
        </p>
      </header>

      <Banner
        niveau={seuil ? "ok" : "critique"}
        icon={seuil ? <IconCheck size={20} /> : <IconAlert size={20} />}
        title={seuil ? "Index supérieur ou égal à 75/100" : "Index sous le seuil de 75/100"}
      >
        {seuil
          ? "Votre index est conforme. Pensez à le publier sur le site de l'entreprise et à le transmettre aux représentants du personnel avant le 1er mars."
          : "Un plan de rattrapage visant à atteindre 75 points sous 3 ans est obligatoire (L. 1142-9). Fixez un budget et un calendrier, et négociez avec les IRP."}
      </Banner>

      <div className="grid-stats">
        <StatCard label="Index d'égalité professionnelle" value={`${index.total}/100`} sub={`${index.indicateurs.filter((i) => i.calculable).length}/5 indicateurs calculables`}>
          <div className="mt-3">
            <Bar valeur={index.total} niveau={seuil ? "ok" : "critique"} />
          </div>
        </StatCard>
        {index.indicateurs.map((i) => (
          <StatCard key={i.code} label={`Indicateur ${i.code} — ${i.nom}`} value={`${i.points}/${i.max}`} sub={i.calculable ? "Calculé" : "Non calculable"}>
            {i.calculable && (
              <div className="mt-3">
                <Bar valeur={(i.points / i.max) * 100} niveau={i.points / i.max >= 0.6 ? "ok" : i.points / i.max >= 0.4 ? "attention" : "critique"} />
              </div>
            )}
          </StatCard>
        ))}
      </div>

      <Section title="Détail des indicateurs">
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>Indicateur</th>
                <th className="num">Points</th>
                <th className="num">Maximum</th>
                <th>Statut</th>
              </tr>
            </thead>
            <tbody>
              {index.indicateurs.map((i) => (
                <tr key={i.code}>
                  <td style={{ fontWeight: 600 }}>
                    {i.code}. {i.nom}
                  </td>
                  <td className="num" style={{ fontWeight: 700 }}>
                    {i.points}
                  </td>
                  <td className="num">{i.max}</td>
                  <td>
                    <Badge niveau={i.calculable ? (i.points / i.max >= 0.6 ? "ok" : "attention") : "neutral"}>
                      {i.calculable ? `${Math.round((i.points / i.max) * 100)} % du maximum` : "Non calculable"}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-4" style={{ display: "grid", gap: 10 }}>
          {index.indicateurs.map((i) => (
            <div className="obligation-card" key={i.code} style={{ marginBottom: 0 }}>
              <div style={{ fontWeight: 600 }}>
                Indicateur {i.code} — {i.nom} ({i.points}/{i.max})
              </div>
              <div className="src">{i.detail}</div>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Méthodologie">
        <Banner niveau="attention" icon={<IconInfo size={20} />} title="Simplifications de la démonstration">
          <ul style={{ paddingLeft: 18, marginTop: 4, display: "grid", gap: 4 }}>
            <li>
              Seuil d'exclusion des cellules (CSP × tranche d'âge) fixé à 1 salarié par genre — la réglementation exige 3. Sur votre
              jeu réel, respectez le seuil officiel.
            </li>
            <li>
              Entreprises de moins de 250 salariés : 2 tranches d'âge (moins de 30 ans, 30 ans et plus), conformément à la réglementation.
            </li>
            <li>Les indicateurs sans données (augmentations, promotions, congés maternité) sont neutralisés et leur poids redistribué.</li>
          </ul>
        </Banner>
        {!seuil && (
          <div className="mt-4">
            <button className="btn btn-primary" onClick={() => onNavigate("rattrapage")}>
              Construire le plan de rattrapage →
            </button>
          </div>
        )}
      </Section>
    </>
  );
}
