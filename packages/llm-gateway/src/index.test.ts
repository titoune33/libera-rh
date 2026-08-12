import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { llm, compteur, BudgetDepasseError } from "./index.js";
import { resoudreModele, providersPourModele } from "./routing.js";
import { estimerCout, estimerTokens } from "./costs.js";
import { viderCache } from "./cache.js";

/** Réponse OpenAI-compatible factice. */
function reponseOk(texte: string) {
  return new Response(
    JSON.stringify({
      choices: [{ message: { content: texte } }],
      usage: { prompt_tokens: 100, completion_tokens: 50 },
    }),
    { status: 200, headers: { "Content-Type": "application/json" } }
  );
}

const fetchMock = vi.fn();

describe("routage", () => {
  it("route reasoning → DeepSeek (modèle fort)", () => {
    expect(resoudreModele("auto", "reasoning")).toBe("deepseek-v4-flash-0731");
  });
  it("route chat → Qwen gratuit HF par défaut", () => {
    expect(resoudreModele("auto", "chat")).toBe("Qwen/Qwen3-4B-Instruct-2507");
  });
  it("préfère deepseek puis hf pour un modèle DeepSeek", () => {
    expect(providersPourModele("deepseek-v4-flash-0731")).toEqual(["deepseek", "hf"]);
  });
  it("respecte un modèle explicite", () => {
    expect(resoudreModele("mistral-medium-3-5", "chat")).toBe("mistral-medium-3-5");
  });
});

describe("coûts", () => {
  it("estime ~4 caractères par token", () => {
    expect(estimerTokens("abcd")).toBe(1);
    expect(estimerTokens("a".repeat(400))).toBe(100);
  });
  it("calcule le coût d'un appel DeepSeek (0,14$/0,28$ par M)", () => {
    const cout = estimerCout("deepseek", 1_000_000, 500_000);
    expect(cout).toBeCloseTo(0.28, 5); // 0,14 + 0,14
  });
});

describe("complete()", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", fetchMock);
    fetchMock.mockReset();
    process.env.HF_TOKEN = "hf_test";
    process.env.DEEPSEEK_API_KEY = "ds_test";
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    viderCache();
  });

  it("appelle le provider routé et renvoie le résultat", async () => {
    fetchMock.mockResolvedValue(reponseOk("Note de synthèse…"));
    const r = await llm.complete({ prompt: "Analyse les écarts.", task: "reasoning" });
    expect(r.texte).toBe("Note de synthèse…");
    expect(r.provider).toBe("deepseek");
    expect(r.enCache).toBe(false);
    expect(r.coutUsd).toBeGreaterThan(0);
    // le fetch a bien reçu le modèle DeepSeek
    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toContain("api.deepseek.com");
    expect(JSON.parse(init.body).model).toBe("deepseek-v4-flash-0731");
  });

  it("bascule en fallback hf si le provider principal échoue", async () => {
    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({ error: { message: "down" } }), { status: 503 }));
    fetchMock.mockResolvedValueOnce(reponseOk("Réponse de secours"));
    const r = await llm.complete({ prompt: "Test fallback", task: "reasoning" });
    expect(r.texte).toBe("Réponse de secours");
    expect(r.provider).toBe("hf");
    expect(r.fallbackUtilise).toBe(true);
  });

  it("sert le cache pour un prompt identique (0 appel réseau)", async () => {
    fetchMock.mockResolvedValue(reponseOk("Première réponse"));
    await llm.complete({ prompt: "Même prompt", task: "chat" });
    const r2 = await llm.complete({ prompt: "Même prompt", task: "chat" });
    expect(r2.enCache).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("lève BudgetDepasseError si le budget est dépassé avant l'appel", async () => {
    await expect(
      llm.complete({ prompt: "x".repeat(10_000), task: "prose", maxCostUsd: 0.0001 })
    ).rejects.toBeInstanceOf(BudgetDepasseError);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("lève une erreur claire sans aucune clé configurée", async () => {
    delete process.env.HF_TOKEN;
    delete process.env.DEEPSEEK_API_KEY;
    await expect(llm.complete({ prompt: "Salut" })).rejects.toThrow(/clés API manquantes/);
  });

  it("comptabilise les coûts globalement", async () => {
    fetchMock.mockResolvedValue(reponseOk("ok"));
    await llm.complete({ prompt: "Coût", task: "chat" });
    expect(compteur.appels).toBeGreaterThan(0);
    expect(compteur.coutTotalUsd).toBeGreaterThanOrEqual(0);
  });
});
