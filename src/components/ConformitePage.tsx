import type { ResultatAnalyse } from "../lib/types";
import { BASE_LEGALE, OBLIGATIONS, SANCTIONS } from "../lib/conformite";
import { Section, Badge, Banner } from "./ui";
import { IconAlert, IconCheck, IconShield } from "./icons";

const LABELS_STATUT: Record<string, { label: string; niveau: "ok" | "attention" | "critique" | "neutral" }> = {
  a_faire: { label: "À mettre en place", niveau: "attention" },
  en_cours: { label: "En cours", niveau: "neutral" },
  faite: { label: "En place", niveau: "ok" },
  attention: { label: "À surveiller", niveau: "attention" },
};

export function ConformitePage({ resultat }: { resultat: ResultatAnalyse }) {
  return (
    <>
      <header className="page-head">
        <h1>Guide de conformité</h1>
        <p>
          L'ensemble des obligations de transparence salariale applicables aux entreprises françaises en 2026, issues de la directive
          européenne 2023/970 et du droit national. Cet outil aide à la mise en conformité mais ne remplace pas un avis juridique.
        </p>
      </header>

      <Banner niveau={resultat.pointsEcart >= 75 ? "ok" : "critique"} icon={<IconShield size={20} />} title="Votre situation actuelle">
        Score d'égalité de {resultat.pointsEcart}/100 calculé sur les données chargées. Seuil réglementaire de l'index : 75/100.
      </Banner>

      <Section title="Base légale">
        <ul style={{ listStyle: "none", padding: 0, display: "grid", gap: 8 }}>
          {BASE_LEGALE.map((b) => (
            <li key={b} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
              <IconCheck size={16} style={{ color: "var(--c-ok)", marginTop: 3, flexShrink: 0 }} />
              <span>{b}</span>
            </li>
          ))}
        </ul>
      </Section>

      <Section title="Obligations et échéances">
        {OBLIGATIONS.map((o) => {
          const statut = LABELS_STATUT[o.statut];
          return (
            <div className="obligation-card" key={o.id}>
              <div className="head">
                <div style={{ fontWeight: 650 }}>{o.titre}</div>
                <span className="echeance">{o.echeance}</span>
              </div>
              <div className="src">
                {o.source} · <Badge niveau={statut.niveau}>{statut.label}</Badge>
              </div>
              <p className="small" style={{ color: "var(--c-text-soft)" }}>
                {o.description}
              </p>
            </div>
          );
        })}
      </Section>

      <div className="grid-2">
        <Section title="Risques de sanctions">
          {SANCTIONS.map((s) => (
            <div className="obligation-card" style={{ marginBottom: 12 }} key={s.titre}>
              <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                <IconAlert size={16} style={{ color: "var(--c-danger)", marginTop: 3, flexShrink: 0 }} />
                <div>
                  <div style={{ fontWeight: 650 }}>{s.titre}</div>
                  <p className="small" style={{ color: "var(--c-text-soft)", marginTop: 2 }}>
                    {s.detail}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </Section>

        <Section title="IA et RH : l'AI Act vous concerne">
          <p className="small" style={{ color: "var(--c-text-soft)" }}>
            Depuis le 6 août 2026, les systèmes d'IA utilisés en recrutement et en gestion RH (tri de CV, scoring, évaluation) relèvent
            de la catégorie « haut risque » du règlement (UE) 2024/1689. Concrètement :
          </p>
          <ul className="mt-3" style={{ paddingLeft: 18, display: "grid", gap: 8, fontSize: 14 }}>
            <li>Auditer les algorithmes : critères utilisés, biais potentiels, transparence des modèles.</li>
            <li>Instaurer une gouvernance interfonctionnelle (RH, juridique, DSI, représentants du personnel).</li>
            <li>Garder un contrôle humain sur les décisions sensibles (recrutement, promotion, rémunération).</li>
            <li>Documenter l'usage de l'IA dans le rapport de transparence salariale.</li>
          </ul>
          <div className="mt-4" style={{ background: "var(--c-primary-soft)", borderRadius: 10, padding: 14 }}>
            <div style={{ fontWeight: 650, fontSize: 14, marginBottom: 4 }}>Bon à savoir</div>
            <p className="small" style={{ color: "var(--c-text-soft)" }}>
              L'IA ne remplace pas l'analyse : les écarts de rémunération doivent être justifiés par des critères objectifs documentés.
              Un score automatique ne constitue jamais, à lui seul, une justification valable.
            </p>
          </div>
        </Section>
      </div>
    </>
  );
}
