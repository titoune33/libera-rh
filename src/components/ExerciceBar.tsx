import type { Exercice } from "../AppShell";

export function ExerciceBar({
  exercices,
  actif,
  onSelect,
  onAjouter,
}: {
  exercices: Exercice[];
  actif: number;
  onSelect: (i: number) => void;
  onAjouter: () => void;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        flexWrap: "wrap",
        marginBottom: 24,
        padding: "10px 14px",
        background: "var(--c-surface)",
        border: "1px solid var(--c-border)",
        borderRadius: 12,
      }}
      aria-label="Sélection d'exercice"
    >
      <span style={{ fontSize: 13, fontWeight: 600, color: "var(--c-text-faint)", marginRight: 4 }}>
        Exercice comptable :
      </span>
      {exercices.map((e, i) => {
        const selected = i === actif;
        return (
          <button
            key={e.exercice}
            type="button"
            className="btn"
            style={
              selected
                ? { background: "var(--c-primary)", borderColor: "var(--c-primary)", color: "#fff", padding: "5px 12px", minHeight: 32, fontSize: 13 }
                : { padding: "5px 12px", minHeight: 32, fontSize: 13 }
            }
            aria-pressed={selected}
            onClick={() => onSelect(i)}
          >
            {e.exercice}
            {selected && (
              <span style={{ fontSize: 11, opacity: 0.85, marginLeft: 2 }}>
                · {e.jeu.employes.length} sal.
              </span>
            )}
          </button>
        );
      })}
      <button
        type="button"
        className="btn btn-ghost"
        style={{ padding: "5px 10px", minHeight: 32, fontSize: 13 }}
        onClick={onAjouter}
      >
        + Nouvel exercice
      </button>
    </div>
  );
}
