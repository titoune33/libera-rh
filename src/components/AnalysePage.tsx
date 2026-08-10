import { useState } from "react";
import type { JeuDeDonnees, ResultatAnalyse } from "../lib/types";
import { formatEuros, formatPct } from "../lib/engine";
import { comparerSecteur, REFERENCES_SECTORIELLES, formatPct as formatPctRef } from "../lib/benchmark";
import { Banner, Section, Badge } from "./ui";
import { IconInfo, IconTrending } from "./icons";

function niveauEcart(v: number | null | undefined): "ok" | "attention" | "critique" {
  const abs = Math.abs(v ?? 0);
  return abs <= 5 ? "ok" : abs <= 8 ? "attention" : "critique";
}

export function AnalysePage({ jeu, resultat }: { jeu: JeuDeDonnees; resultat: ResultatAnalyse }) {
  const categoriesAvecEcart = resultat.parCategorie.filter((c) => c.effectifF > 0 && c.effectifH > 0);

  return (
    <>
      <header className="page-head">
        <h1>Analyse des écarts de rémunération</h1>
        <p>
          Méthodologie conforme à la directive (UE) 2023/970 : écart moyen et médian de rémunération, par catégorie professionnelle et à
          poste comparable. Exercice {jeu.societe.exercice}.
        </p>
      </header>

      <div className="grid-2">
        <Section title="Écart par catégorie professionnelle">
          <div className="table-wrap">
            <table className="data">
              <thead>
                <tr>
                  <th>Catégorie</th>
                  <th className="num">F</th>
                  <th className="num">H</th>
                  <th className="num">Salaire moyen F</th>
                  <th className="num">Salaire moyen H</th>
                  <th className="num">Écart moyen</th>
                  <th className="num">Écart médian</th>
                </tr>
              </thead>
              <tbody>
                {categoriesAvecEcart.map((c) => (
                  <tr key={c.categorie}>
                    <td style={{ fontWeight: 600 }}>{c.categorie}</td>
                    <td className="num">{c.effectifF}</td>
                    <td className="num">{c.effectifH}</td>
                    <td className="num">{formatEuros(c.salaireMoyenF)}</td>
                    <td className="num">{formatEuros(c.salaireMoyenH)}</td>
                    <td className="num">
                      <Badge niveau={niveauEcart(c.ecartMoyenPct)}>{formatPct(c.ecartMoyenPct)}</Badge>
                    </td>
                    <td className="num">{formatPct(c.ecartMedianPct)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="muted small mt-3">
            Les catégories à effectif unisexe ne sont pas affichées (non comparables). Un écart positif signifie que les femmes perçoivent
            en moyenne une rémunération inférieure.
          </p>
        </Section>

        <Section title="Comparaison visuelle (salaire moyen)">
          <div className="legend mb-4">
            <span className="genre-line">
              <span className="dot-f" aria-hidden="true" /> Femmes
            </span>
            <span className="genre-line">
              <span className="dot-h" aria-hidden="true" /> Hommes
            </span>
          </div>
          {categoriesAvecEcart.map((c) => {
            const max = Math.max(c.salaireMoyenF ?? 0, c.salaireMoyenH ?? 0);
            return (
              <div key={c.categorie} className="mb-4">
                <div style={{ fontWeight: 600, fontSize: 13.5, marginBottom: 6 }}>{c.categorie}</div>
                <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: 64 }}>
                  <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4 }}>
                    <div className="bar-track" style={{ height: 8 }}>
                      <div
                        className="bar-fill"
                        style={{ width: `${((c.salaireMoyenF ?? 0) / max) * 100}%`, background: "var(--c-femme)" }}
                      />
                    </div>
                    <span className="small muted">{formatEuros(c.salaireMoyenF)}</span>
                  </div>
                  <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4 }}>
                    <div className="bar-track" style={{ height: 8 }}>
                      <div
                        className="bar-fill"
                        style={{ width: `${((c.salaireMoyenH ?? 0) / max) * 100}%`, background: "var(--c-homme)" }}
                      />
                    </div>
                    <span className="small muted">{formatEuros(c.salaireMoyenH)}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </Section>
      </div>

      <Section title="Positionnement sectoriel (benchmark)">
        <ComparaisonSectorielleSection jeu={jeu} resultat={resultat} />
      </Section>

      <Section title="Analyse à travail comparable">
        {resultat.postesComparables.length === 0 ? (
          <p className="muted">
            Aucun poste occupé à la fois par des femmes et des hommes dans les données chargées. L'analyse « à travail égal » nécessite
            des postes mixtes.
          </p>
        ) : (
          <>
            <div className="table-wrap">
              <table className="data">
                <thead>
                  <tr>
                    <th>Poste</th>
                    <th className="num">F</th>
                    <th className="num">H</th>
                    <th className="num">Écart moyen</th>
                    <th>Niveau</th>
                  </tr>
                </thead>
                <tbody>
                  {resultat.postesComparables.map((p) => (
                    <tr key={p.poste}>
                      <td style={{ fontWeight: 600 }}>{p.poste}</td>
                      <td className="num">{p.effectifF}</td>
                      <td className="num">{p.effectifH}</td>
                      <td className="num">{formatPct(p.ecartMoyenPct)}</td>
                      <td>
                        <Badge niveau={niveauEcart(p.ecartMoyenPct)}>
                          {Math.abs(p.ecartMoyenPct ?? 0) <= 5 ? "Écart limité" : "À justifier"}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-4">
              <Banner niveau="attention" icon={<IconInfo size={20} />} title="Comment justifier un écart à poste comparable ?">
                La directive permet des écarts fondés sur des critères objectifs et neutres : ancienneté, ancienneté de poste,
                performance, pénurie de compétences. Documentez ces justifications par écrit avant toute communication du rapport.
              </Banner>
            </div>
          </>
        )}
      </Section>
    </>
  );
}

function ComparaisonSectorielleSection({ jeu, resultat }: { jeu: JeuDeDonnees; resultat: ResultatAnalyse }) {
  const [code, setCode] = useState(jeu.societe.codeNAF ?? "");
  const comparaison = comparerSecteur(resultat, code || undefined);
  const ecartEntreprise = Math.abs(resultat.global.ecartMoyenPct);

  return (
    <>
      <div className="field">
        <label htmlFor="secteur">Votre secteur d'activité (section NAF)</label>
        <select
          id="secteur"
          className="select"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          style={{ maxWidth: 420 }}
        >
          <option value="">— Choisir un secteur —</option>
          {REFERENCES_SECTORIELLES.map((r) => (
            <option key={r.code} value={r.code}>
              {r.code} — {r.secteur}
            </option>
          ))}
        </select>
        <div className="hint">
          Références INSEE : écart de salaire net annuel en équivalent temps plein femmes-hommes. Votre écart moyen :{" "}
          <strong>{formatPctRef(ecartEntreprise)}</strong>.
        </div>
      </div>

      {comparaison.secteur ? (
        <>
          <div className="mb-4">
            {comparaison.position === "meilleure" && (
              <Banner niveau="ok" icon={<IconTrending size={20} />} title="Meilleure que la moyenne de votre secteur">
                Votre écart ({formatPctRef(ecartEntreprise)}) est inférieur d'au moins 3 points à la référence du secteur{" "}
                {comparaison.secteur.secteur} ({formatPctRef(comparaison.ecartReferencePct ?? 0)}). Un argument solide pour votre
                marque employeur.
              </Banner>
            )}
            {comparaison.position === "conforme" && (
              <Banner niveau="attention" icon={<IconInfo size={20} />} title="Dans la moyenne de votre secteur">
                Votre écart ({formatPctRef(ecartEntreprise)}) reste proche de la référence du secteur{" "}
                {comparaison.secteur.secteur} ({formatPctRef(comparaison.ecartReferencePct ?? 0)}). Poursuivez la surveillance et
                corrigez les postes à écart.
              </Banner>
            )}
            {comparaison.position === "au-dessus" && (
              <Banner niveau="critique" icon={<IconInfo size={20} />} title="Au-dessus de la moyenne de votre secteur">
                Votre écart ({formatPctRef(ecartEntreprise)}) dépasse la référence du secteur{" "}
                {comparaison.secteur.secteur} ({formatPctRef(comparaison.ecartReferencePct ?? 0)}). Priorisez un plan de rattrapage
                sur les postes concernés.
              </Banner>
            )}
          </div>

          <div className="bar-row">
            <div>
              <span style={{ fontWeight: 600 }}>Votre entreprise</span>
              <span className="muted small" style={{ marginLeft: 8 }}>
                {formatPctRef(ecartEntreprise)}
              </span>
            </div>
            <div style={{ width: 260 }}>
              <div className="bar-track">
                <div
                  className="bar-fill"
                  data-niveau={comparaison.position === "au-dessus" ? "critique" : comparaison.position === "conforme" ? "attention" : "ok"}
                  style={{ width: `${Math.min(100, (ecartEntreprise / 25) * 100)}%` }}
                />
              </div>
            </div>
          </div>
          <div className="bar-row">
            <div>
              <span style={{ fontWeight: 600 }}>Référence {comparaison.secteur.secteur}</span>
              <span className="muted small" style={{ marginLeft: 8 }}>
                {formatPctRef(comparaison.ecartReferencePct ?? 0)}
              </span>
            </div>
            <div style={{ width: 260 }}>
              <div className="bar-track">
                <div
                  className="bar-fill"
                  style={{ width: `${Math.min(100, ((comparaison.ecartReferencePct ?? 0) / 25) * 100)}%`, background: "var(--c-text-faint)" }}
                />
              </div>
            </div>
          </div>
          <p className="muted small mt-3">
            Ordre de grandeur national (INSEE / Eurostat), pas une obligation : le benchmark vous aide à prioriser et à argumenter, il
            ne remplace pas l'analyse interne à poste comparable.
          </p>
        </>
      ) : (
        <p className="muted">
          Choisissez votre secteur pour comparer votre écart moyen à la référence nationale. Le code NAF de votre société (saisi lors
          de l'import) est présélectionné automatiquement s'il est connu.
        </p>
      )}
    </>
  );
}
