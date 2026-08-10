import type { JeuDeDonnees, ResultatAnalyse } from "../lib/types";
import { formatEuros, formatPct } from "../lib/engine";
import { evaluerConformite } from "../lib/conformite";
import { analyser } from "../lib/engine";
import type { Exercice, PageId } from "../AppShell";
import { Banner, Section, StatCard, Badge, Bar } from "./ui";
import { IconAlert, IconCheck, IconInfo } from "./icons";

export function Dashboard({
  jeu,
  resultat,
  onNavigate,
  exercices,
  exerciceActif,
}: {
  jeu: JeuDeDonnees;
  resultat: ResultatAnalyse;
  onNavigate: (p: PageId) => void;
  exercices?: Exercice[];
  exerciceActif?: number;
}) {
  const verdict = evaluerConformite(resultat);
  const g = resultat.global;
  const evolution = (exercices ?? []).map((e) => ({ exercice: e.exercice, score: analyser(e.jeu.employes).pointsEcart }));
  const scoreMax = 100;

  return (
    <>
      <header className="page-head">
        <h1>Tableau de bord — {jeu.societe.nom}</h1>
        <p>
          Conformité transparence salariale · Exercice {jeu.societe.exercice} · {jeu.societe.siret}
        </p>
      </header>

      <Banner
        niveau={verdict.niveau}
        icon={verdict.niveau === "ok" ? <IconCheck size={20} /> : verdict.niveau === "attention" ? <IconInfo size={20} /> : <IconAlert size={20} />}
        title={verdict.titre}
      >
        {verdict.detail}
      </Banner>

      <div className="grid-stats">
        <StatCard label="Score d'égalité" value={`${resultat.pointsEcart}/100`} sub="Calqué sur la logique de l'index français">
          <div className="mt-3">
            <Bar
              valeur={resultat.pointsEcart}
              niveau={resultat.pointsEcart >= 75 ? "ok" : resultat.pointsEcart >= 60 ? "attention" : "critique"}
            />
          </div>
        </StatCard>
        <StatCard label="Écart moyen (moyenne)" value={formatPct(g.ecartMoyenPct)} sub="Femmes vs hommes — seuil de vigilance 5 %">
          <div className="mt-3">
            <Badge niveau={Math.abs(g.ecartMoyenPct) <= 5 ? "ok" : Math.abs(g.ecartMoyenPct) <= 8 ? "attention" : "critique"}>
              {Math.abs(g.ecartMoyenPct) <= 5 ? "Sous le seuil" : "Au-dessus du seuil"}
            </Badge>
          </div>
        </StatCard>
        <StatCard label="Écart médian" value={formatPct(g.ecartMedianPct)} sub="Médiane des rémunérations" />
        <StatCard label="Masse salariale" value={formatEuros(g.masseSalariale)} sub={`${g.effectifF} femmes · ${g.effectifH} hommes`} />
      </div>

      <div className="grid-2">
        <Section title="Répartition de l'effectif">
          <div className="legend mb-4">
            <span className="genre-line">
              <span className="dot-f" aria-hidden="true" /> Femmes : {g.effectifF} ({((g.effectifF / (g.effectifF + g.effectifH)) * 100).toFixed(0).replace(".", ",")} %)
            </span>
            <span className="genre-line">
              <span className="dot-h" aria-hidden="true" /> Hommes : {g.effectifH} ({((g.effectifH / (g.effectifF + g.effectifH)) * 100).toFixed(0).replace(".", ",")} %)
            </span>
          </div>
          <div style={{ display: "flex", gap: 6, alignItems: "flex-end", height: 140 }}>
            <div
              style={{ flex: 1, background: "var(--c-femme)", borderRadius: "8px 8px 0 0", height: `${(g.effectifF / (g.effectifF + g.effectifH)) * 100}%`, minHeight: 10 }}
              aria-label={`Femmes : ${g.effectifF}`}
            />
            <div
              style={{ flex: 1, background: "var(--c-homme)", borderRadius: "8px 8px 0 0", height: `${(g.effectifH / (g.effectifF + g.effectifH)) * 100}%`, minHeight: 10 }}
              aria-label={`Hommes : ${g.effectifH}`}
            />
          </div>
        </Section>

        <Section title="Prochaines échéances de conformité">
          <ul style={{ listStyle: "none", padding: 0, display: "grid", gap: 10 }}>
            <li className="obligation-card" style={{ marginBottom: 0 }}>
              <div className="head">
                <div style={{ fontWeight: 600 }}>Index d'égalité professionnelle</div>
                <span className="echeance">1er mars</span>
              </div>
              <div className="src">Code du travail, L. 1142-8</div>
              <Badge niveau={resultat.pointsEcart >= 75 ? "ok" : "critique"}>Score : {resultat.pointsEcart}/100</Badge>
            </li>
            <li className="obligation-card" style={{ marginBottom: 0 }}>
              <div className="head">
                <div style={{ fontWeight: 600 }}>Fourchettes salariales dans les offres</div>
                <span className="echeance">7 juin 2026</span>
              </div>
              <div className="src">Directive (UE) 2023/970, art. 5</div>
              <Badge niveau="attention">À mettre en place</Badge>
            </li>
            <li className="obligation-card" style={{ marginBottom: 0 }}>
              <div className="head">
                <div style={{ fontWeight: 600 }}>Rapport annuel sur l'écart</div>
                <span className="echeance">2027</span>
              </div>
              <div className="src">Directive (UE) 2023/970, art. 9</div>
              <Badge niveau="attention">Premier rapport</Badge>
            </li>
          </ul>
        </Section>
      </div>        <Section title="Évolution du score (multi-exercices)">
          {evolution.length <= 1 ? (
            <p className="muted">
              Un seul exercice chargé. Cliquez sur « + Nouvel exercice » pour créer l'exercice en cours et suivre l'évolution de votre
              score dans le temps.
            </p>
          ) : (
            <>
              <div style={{ display: "flex", alignItems: "flex-end", gap: 16, height: 140, marginTop: 8 }}>
                {evolution.map((e, i) => {
                  const actuel = i === exerciceActif;
                  return (
                    <div key={e.exercice} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                      <span className="num" style={{ fontWeight: 700 }}>
                        {e.score}
                      </span>
                      <div
                        style={{
                          width: "100%",
                          maxWidth: 90,
                          borderRadius: "8px 8px 0 0",
                          background: actuel ? "var(--c-primary)" : "var(--c-primary-border)",
                          height: `${(e.score / scoreMax) * 100}%`,
                          minHeight: 14,
                        }}
                        aria-label={`Exercice ${e.exercice} : score ${e.score}/100`}
                      />
                      <span className="small muted" style={{ fontWeight: actuel ? 700 : 500 }}>
                        {e.exercice}
                        {actuel ? " · actuel" : ""}
                      </span>
                    </div>
                  );
                })}
              </div>
              <p className="muted small mt-3">Score /100 par exercice comptable. La tendance est un argument fort pour votre rapport annuel.</p>
            </>
          )}
        </Section>

        <Section title="Prochaines actions recommandées">
        <div style={{ display: "grid", gap: 10 }}>
          {resultat.postesComparables.some((p) => Math.abs(p.ecartMoyenPct ?? 0) > 5) && (
            <div className="obligation-card" style={{ marginBottom: 0 }}>
              <div style={{ fontWeight: 600 }}>Analyser les postes à écart supérieur à 5 %</div>
              <div className="src">
                {resultat.postesComparables
                  .filter((p) => Math.abs(p.ecartMoyenPct ?? 0) > 5)
                  .map((p) => p.poste)
                  .join(", ")}
              </div>
              <button className="btn btn-primary mt-3" onClick={() => onNavigate("analyse")}>
                Voir l'analyse détaillée
              </button>
            </div>
          )}
          <div className="obligation-card" style={{ marginBottom: 0 }}>
            <div style={{ fontWeight: 600 }}>Générer le rapport conforme et les fourchettes salariales</div>
            <div className="src">Prêt à publier dans vos offres d'emploi (directive art. 5)</div>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button className="btn btn-primary mt-3" onClick={() => onNavigate("rapport")}>
                Générer le rapport
              </button>
              <button className="btn mt-3" onClick={() => onNavigate("fourchettes")}>
                Fourchettes salariales
              </button>
            </div>
          </div>
        </div>
      </Section>
    </>
  );
}
