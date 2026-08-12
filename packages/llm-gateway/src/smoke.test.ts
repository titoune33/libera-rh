import { describe, expect, it } from "vitest";
import { llm } from "./index.js";

/**
 * Smoke test réel (non mocké) : s'exécute uniquement si HF_TOKEN est présent
 * dans l'environnement. Vérifie que le gateway appelle vraiment le router
 * Hugging Face et renvoie un texte exploitable.
 */
const aCle = Boolean(process.env.HF_TOKEN || process.env.DEEPSEEK_API_KEY || process.env.OPENROUTER_API_KEY);

describe.skipIf(!aCle)("llm-gateway — appel réel", () => {
  it(
    "appelle le provider HF et renvoie une réponse",
    async () => {
      const r = await llm.complete({
        prompt: "Réponds uniquement : bonjour",
        task: "chat",
        maxTokens: 20,
        temperature: 0,
      });
      expect(r.texte.length).toBeGreaterThan(0);
      expect(r.enCache).toBe(false);
      console.log(`[smoke] provider=${r.provider} modele=${r.modele} latence=${r.latenceMs}ms cout=${r.coutUsd}`);
    },
    60_000
  );

  it("met la réponse en cache pour un second appel identique", async () => {
    const opts = { prompt: "Réponds uniquement : bonjour", task: "chat", maxTokens: 20, temperature: 0 };
    await llm.complete(opts);
    const r2 = await llm.complete(opts);
    expect(r2.enCache).toBe(true);
  }, 60_000);
});
