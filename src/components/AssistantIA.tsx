import { useState } from "react";
import type { JeuDeDonnees, ResultatAnalyse } from "../lib/types";
import { formatEuros, formatPct } from "../lib/engine";
import { genererNoteLocale } from "../lib/assistantLocal";
import { Badge, Banner } from "./ui";
import { IconInfo, IconSparkles } from "./icons";

export function construireContexte(jeu: JeuDeDonnees, resultat: ResultatAnalyse): string {
  const g = resultat.global;
  const categories = resultat.parCategorie
    .filter((c) => c.effectifF > 0 && c.effectifH > 0)
    .map((c) => `${c.categorie} : écart moyen ${formatPct(c.ecartMoyenPct)}, effectifs ${c.effectifF} F / ${c.effectifH} H`)
    .join(" ; ");
  const postes = resultat.postesComparables
    .map((p) => `${p.poste} : écart ${formatPct(p.ecartMoyenPct)}`)
    .join(" ; ");
  return [
    `Société : ${jeu.societe.nom} (SIRET ${jeu.societe.siret}), exercice ${jeu.societe.exercice}, effectif analysé ${jeu.employes.length}.`,
    `Score d'égalité : ${resultat.pointsEcart}/100.`,
    `Écart moyen global femmes-hommes : ${formatPct(g.ecartMoyenPct)} (positif = les femmes gagnent en moyenne moins que les hommes) ; écart médian : ${formatPct(g.ecartMedianPct)} ; masse salariale ${formatEuros(g.masseSalariale)}.`,
    `Écarts par catégorie : ${categories || "aucune catégorie mixte"}.`,
    `Postes comparables : ${postes || "aucun poste mixte"}.`,
  ].join("\n");
}

export function AssistantIA({ jeu, resultat }: { jeu: JeuDeDonnees; resultat: ResultatAnalyse }) {
  const [question, setQuestion] = useState("");
  const [chargement, setChargement] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [mode, setMode] = useState<"hf" | "local" | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const generer = async () => {
    setChargement(true);
    setNote(null);
    setInfo(null);
    const contexte = construireContexte(jeu, resultat);
    try {
      const rep = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contexte, question: question.trim() || undefined }),
        signal: AbortSignal.timeout(65000),
      });
      const data = (await rep.json().catch(() => null)) as { texte?: string; mode?: string; erreur?: string; aide?: string } | null;
      if (rep.ok && data?.texte) {
        setNote(data.texte);
        setMode(data.mode === "hf" ? "hf" : "local");
        return;
      }
      setInfo(data?.aide ?? data?.erreur ?? "L'API d'assistance n'a pas répondu. Bascule sur le générateur local.");
    } catch {
      setInfo("API d'assistance indisponible (mode démo locale ou hors ligne). Bascule sur le générateur local.");
    }
    setNote(genererNoteLocale(jeu, resultat, question));
    setMode("local");
    setChargement(false);
  };

  return (
    <div className="section">
      <div className="flex-between mb-4">
        <h2 style={{ marginBottom: 0 }}>Assistant IA — note de synthèse</h2>
        {mode && (
          <Badge niveau={mode === "hf" ? "ok" : "neutral"}>
            {mode === "hf" ? "Moteur Hugging Face (IA open-source)" : "Moteur local"}
          </Badge>
        )}
      </div>
      <p className="muted small" style={{ marginBottom: 12 }}>
        Rédige une note de synthèse de conformité à partir de vos écarts, avec actions priorisées. Appuyé sur l'inférence gratuite
        Hugging Face (modèle IA open-source multilingue) quand elle est configurée, sinon sur le générateur local d'Équilibre.
      </p>
      <div className="field">
        <label htmlFor="question-ia">Question ou angle précis (facultatif)</label>
        <textarea
          id="question-ia"
          className="textarea"
          rows={2}
          placeholder="Ex. : prioriser les actions pour le conseil social, ou rédiger l'argumentaire marque employeur…"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
        />
      </div>
      <div className="rapport-actions">
        <button className="btn btn-primary" onClick={generer} disabled={chargement}>
          <IconSparkles size={16} />
          {chargement ? "Génération…" : note ? "Régénérer la note" : "Générer la note de synthèse"}
        </button>
      </div>

      {info && (
        <div className="mt-3">
          <Banner niveau="attention" icon={<IconInfo size={20} />} title="Assistant en mode local">
            {info}
          </Banner>
        </div>
      )}

      {note && (
        <div className="rapport-paper mt-4">
          <pre>{note}</pre>
        </div>
      )}
    </div>
  );
}
