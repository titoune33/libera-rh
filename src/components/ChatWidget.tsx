import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { JeuDeDonnees, ResultatAnalyse } from "../lib/types";
import { construireContexte } from "./AssistantIA";
import { repondreLocal } from "../lib/chatLocal";
import { IconSparkles, IconInfo, IconLock } from "./icons";

interface MessageUi {
  role: "user" | "assistant";
  content: string;
}

const QUESTIONS_RAPIDES = [
  "Comment améliorer mon index ?",
  "Que mettre dans une fourchette salariale ?",
  "C'est quoi le plan de rattrapage ?",
  "Quelles sont mes obligations ?",
];

export function ChatWidget({ jeu, resultat, planGratuit }: { jeu: JeuDeDonnees; resultat: ResultatAnalyse; planGratuit?: boolean }) {
  const navigate = useNavigate();
  const [ouvert, setOuvert] = useState(false);
  const [messages, setMessages] = useState<MessageUi[]>([]);
  const [saisie, setSaisie] = useState("");
  const [chargement, setChargement] = useState(false);
  const [mode, setMode] = useState<"hf" | "local" | null>(null);
  const finRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    finRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, chargement, ouvert]);

  const envoyer = async (texte: string) => {
    const question = texte.trim();
    if (!question || chargement) return;
    const contexte = construireContexte(jeu, resultat);
    const nouveau: MessageUi[] = [...messages, { role: "user", content: question }];
    setMessages(nouveau);
    setSaisie("");
    setChargement(true);
    try {
      const rep = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: nouveau.map((m) => ({ role: m.role, content: m.content })),
          contexte,
        }),
        signal: AbortSignal.timeout(60000),
      });
      const data = (await rep.json().catch(() => null)) as { texte?: string; mode?: string; erreur?: string } | null;
      if (rep.ok && data?.texte) {
        setMode(data.mode === "hf" ? "hf" : "local");
        setMessages([...nouveau, { role: "assistant", content: data.texte }]);
        return;
      }
    } catch {
      /* bascule locale */
    }
    setMode("local");
    setMessages([...nouveau, { role: "assistant", content: repondreLocal(question, contexte) }]);
    setChargement(false);
  };

  return (
    <div className="chat-widget">
      {ouvert && (
        <div className="chat-panel" role="dialog" aria-label="Assistant Équitia" aria-live="polite">
          <div className="chat-head">
            <span className="chat-head-brand">
              <IconSparkles size={16} />
              Assistant Équitia
            </span>
            {mode && <span className={`chat-mode chat-mode-${mode}`}>{mode === "hf" ? "IA en ligne" : "Moteur local"}</span>}
            <button
              type="button"
              className="chat-close"
              aria-label="Fermer l'assistant"
              onClick={() => setOuvert(false)}
            >
              ✕
            </button>
          </div>

          <div className="chat-body">
            {planGratuit && messages.length === 0 ? (
              <div className="chat-welcome">
                <p style={{ textAlign: "center", marginTop: 16 }}>
                  <IconLock size={24} style={{ color: "var(--c-text-faint)", marginBottom: 8, display: "block", margin: "0 auto 12px" }} />
                  L'assistant IA est réservé au plan Pro.
                </p>
                <button
                  className="btn btn-primary"
                  style={{ display: "block", margin: "12px auto" }}
                  onClick={() => navigate("/app?abonnement=1")}
                >
                  Passer à Pro — 49 €/mois
                </button>
              </div>
            ) : messages.length === 0 && (
              <div className="chat-welcome">
                <p>
                  Posez-moi une question sur votre conformité salariale : index, fourchettes, plan de rattrapage, rapport,
                  obligations…
                </p>
                <div className="chat-chips">
                  {QUESTIONS_RAPIDES.map((q) => (
                    <button key={q} type="button" className="chat-chip" onClick={() => envoyer(q)}>
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {messages.map((m, i) => (
              <div key={i} className={`chat-msg chat-msg-${m.role}`}>
                {m.content}
              </div>
            ))}
            {chargement && (
              <div className="chat-msg chat-msg-assistant chat-typing">
                <span>Réflexion</span>
                <span className="chat-dots" aria-hidden="true">…</span>
              </div>
            )}
            <div ref={finRef} />
          </div>

          <form
            className="chat-input"
            onSubmit={(e) => {
              e.preventDefault();
              void envoyer(saisie);
            }}
          >
            <input
              ref={inputRef}
              type="text"
              value={saisie}
              onChange={(e) => setSaisie(e.target.value)}
              placeholder="Votre question…"
              aria-label="Votre question"
              disabled={chargement}
            />
            <button type="submit" className="btn btn-primary" disabled={chargement || !saisie.trim()} aria-label="Envoyer">
              Envoyer
            </button>
          </form>
          {mode === "local" && (
            <div className="chat-note">
              <IconInfo size={12} />
              Mode local : connectez Hugging Face (HF_TOKEN) pour des réponses IA complètes.
            </div>
          )}
        </div>
      )}

      <button
        type="button"
        className="chat-fab"
        aria-label={ouvert ? "Fermer l'assistant Équitia" : "Ouvrir l'assistant Équitia"}
        aria-expanded={ouvert}
        onClick={() => {
          setOuvert((o) => !o);
          if (!ouvert) setTimeout(() => inputRef.current?.focus(), 50);
        }}
      >
        {ouvert ? "✕" : <IconSparkles size={22} />}
      </button>
    </div>
  );
}
