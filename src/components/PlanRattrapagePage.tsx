import { useMemo, useState } from "react";
import type { JeuDeDonnees, ResultatAnalyse } from "../lib/types";
import { simulerRattrapage } from "../lib/planRattrapage";
import { formatEuros } from "../lib/engine";
import { Section, StatCard, Banner, Badge } from "./ui";
import { IconInfo } from "./icons";

export function PlanRattrapagePage({ jeu, resultat }: { jeu: JeuDeDonnees; resultat: ResultatAnalyse }) {
  const [seuil, setSeuil] = useState(5);
  const [duree, setDuree] = useState(3);

  const { simulation } = useMemo(
    () => simulerRattrapage(jeu.employes, seuil, duree),
    [jeu.employes, seuil, duree],
  );

  const amelioration = simulation.scoreProjete - simulation.scoreInitial;

  return (
    <>
      <header className="page-head">
        <h1>Plan de rattrapage</h1>
        <p>
          Simulez la correction des écarts « à poste comparable » : budget annuel, calendrier pluriannuel et impact sur le score
          d'égalité. Obligatoire dès que l'index passe sous 75/100.
        </p>
      </header>

      {resultat.pointsEcart >= 75 ? (
        <Banner niveau="ok" icon={<IconInfo size={20} />} title="Votre score est au-dessus du seuil réglementaire">
          Le plan de rattrapage n'est pas obligatoire, mais corriger les écarts résiduels renforce votre conformité et votre marque
          employeur.
        </Banner>
      ) : (
        <Banner niveau="critique" icon={<IconInfo size={20} />} title="Score sous le seuil de 75/100">
          Un plan de rattrapage est requis : fixez un budget, un calendrier de correction sous 3 ans et négociez-le avec les
          représentants du personnel.
        </Banner>
      )}

      <Section title="Paramètres de la simulation">
        <div className="grid-2">
          <div className="field">
            <label htmlFor="seuil">Seuil d'écart à corriger : &gt; {seuil} %</label>
            <input
              id="seuil"
              type="range"
              min={1}
              max={10}
              step={1}
              value={seuil}
              onChange={(e) => setSeuil(Number(e.target.value))}
              style={{ width: "100%" }}
            />
            <div className="hint">Seuls les postes mixtes dont l'écart moyen dépasse ce seuil sont inclus dans le plan.</div>
          </div>
          <div className="field">
            <label htmlFor="duree">Durée du plan : {duree} an{duree > 1 ? "s" : ""}</label>
            <input
              id="duree"
              type="range"
              min={1}
              max={5}
              step={1}
              value={duree}
              onChange={(e) => setDuree(Number(e.target.value))}
              style={{ width: "100%" }}
            />
            <div className="hint">La réglementation impose une correction sous 3 ans maximum.</div>
          </div>
        </div>
      </Section>

      <div className="grid-stats">
        <StatCard label="Coût annuel total" value={formatEuros(simulation.coutTotalAnnuel)} sub="Rehausse des salaires femmes sur les postes concernés" />
        <StatCard label="Budget recommandé an 1" value={formatEuros(simulation.budgetRecommandee)} sub="Coût + marge de 20 %" />
        <StatCard label="Score après correction" value={`${simulation.scoreInitial} → ${simulation.scoreProjete}`} sub={`Amélioration : +${amelioration} pts`}>
          <div className="mt-3">
            <Badge niveau={simulation.scoreProjete >= 75 ? "ok" : "attention"}>
              {simulation.scoreProjete >= 75 ? "Seuil de 75 atteint" : "Seuil de 75 non atteint"}
            </Badge>
          </div>
        </StatCard>
        <StatCard
          label="Écart moyen"
          value={`${simulation.ecartInitialPct.toFixed(1).replace(".", ",")} % → ${simulation.ecartProjetePct.toFixed(1).replace(".", ",")} %`}
          sub="Après correction des postes concernés"
        />
      </div>

      {simulation.postes.length > 0 && (
        <Section title="Postes à corriger">
          <div className="table-wrap">
            <table className="data">
              <thead>
                <tr>
                  <th>Poste</th>
                  <th className="num">Effectif F</th>
                  <th className="num">Salaire moyen F</th>
                  <th className="num">Salaire moyen H</th>
                  <th className="num">Écart</th>
                  <th className="num">Coût annuel</th>
                </tr>
              </thead>
              <tbody>
                {simulation.postes.map((p) => (
                  <tr key={p.poste}>
                    <td style={{ fontWeight: 600 }}>{p.poste}</td>
                    <td className="num">{p.effectifF}</td>
                    <td className="num">{formatEuros(p.salaireMoyenF)}</td>
                    <td className="num">{formatEuros(p.salaireMoyenH)}</td>
                    <td className="num">
                      <Badge niveau={p.ecartPct > 8 ? "critique" : "attention"}>+{p.ecartPct.toFixed(1).replace(".", ",")} %</Badge>
                    </td>
                    <td className="num" style={{ fontWeight: 650 }}>
                      {formatEuros(p.coutAnnuel)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>
      )}

      {simulation.postes.length === 0 && (
        <Section title="Aucun poste à corriger">
          <p className="muted">Aucun poste mixte ne dépasse le seuil de {seuil} % : la situation est conforme sur les postes comparables.</p>
        </Section>
      )}

      <Section title={`Calendrier de correction (${simulation.dureeAnnee} ans)`}>
        {simulation.coutParAn.map((cout, i) => (
          <div className="bar-row" key={i}>
            <div>
              <span style={{ fontWeight: 600 }}>Année {i + 1}</span>
              <span className="muted small" style={{ marginLeft: 8 }}>
                {i === 0 ? "60 % du budget (rattrapage prioritaire)" : "Lissage de la correction"}
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 180 }}>
                <div className="bar-track">
                  <div
                    className="bar-fill"
                    data-niveau={i === 0 ? "attention" : "ok"}
                    style={{ width: `${(cout / Math.max(1, simulation.coutParAn[0])) * 100}%` }}
                  />
                </div>
              </div>
              <span className="num" style={{ minWidth: 100 }}>
                {formatEuros(cout)}
              </span>
            </div>
          </div>
        ))}
        <p className="muted small mt-3">
          La correction simulée rehausse chaque salariée des postes concernés au niveau moyen du poste. En pratique, intégrez le budget
          dans la négociation annuelle (L. 2242-1) et priorisez les postes à plus fort écart.
        </p>
      </Section>
    </>
  );
}
