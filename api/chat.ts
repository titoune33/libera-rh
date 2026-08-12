import type { VercelRequest, VercelResponse } from "@vercel/node";

export const config = { maxDuration: 60 };

const HF_ENDPOINT = "https://router.huggingface.co/v1/chat/completions";
const MODELE_DEFAUT = "Qwen/Qwen3-4B-Instruct-2507";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const PROMPT_SYSTEM = `Tu es l'assistant d'« Équitia », un SaaS français de conformité salariale (directive (UE) 2023/970, index d'égalité professionnelle). Tu réponds en français, de façon concise et structurée (liste à puces si utile). Règles : base-toi uniquement sur le contexte fourni par l'utilisateur et sur tes connaissances générales ; ne cite aucune disposition juridique précise (pas de numéros d'articles) ; si une information manque, dis-le ; ne formule pas de certitudes juridiques ; reste courtois et pragmatique.`;

export default async function chat(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.status(405).json({ erreur: "Méthode non autorisée. Utilisez POST." });
    return;
  }

  const { messages, contexte } = (req.body ?? {}) as { messages?: Message[]; contexte?: string };
  if (!Array.isArray(messages) || messages.length === 0) {
    res.status(400).json({ erreur: "Le champ « messages » (liste) est requis." });
    return;
  }

  const token = process.env.HF_TOKEN;
  if (!token) {
    res.status(503).json({ erreur: "HF_TOKEN non configuré sur Vercel.", mode: "local" });
    return;
  }

  const modele = process.env.HF_MODEL ?? MODELE_DEFAUT;
  // Contexte produit en tête de conversation, puis les derniers échanges.
  const historique: Message[] = (messages ?? []).slice(-10).map((m) => ({
    role: m.role === "assistant" ? "assistant" : "user",
    content: String(m.content ?? "").slice(0, 4000),
  }));

  try {
    const rep = await fetch(HF_ENDPOINT, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: `${modele}:fastest`,
        messages: [
          { role: "system", content: PROMPT_SYSTEM },
          ...(contexte ? [{ role: "user", content: `Contexte de l'entreprise (jeu de données actuel) :\n${contexte}` }] : []),
          ...historique,
        ],
        max_tokens: 500,
        temperature: 0.5,
        stream: false,
      }),
      signal: AbortSignal.timeout(55000),
    });

    const data = (await rep.json().catch(() => null)) as {
      choices?: { message?: { content?: string } }[];
      error?: { message?: string };
    } | null;

    if (!rep.ok) {
      const message = data?.error?.message ?? `Hugging Face a répondu ${rep.status}`;
      res.status(502).json({ erreur: message, mode: "local" });
      return;
    }

    const texte = data?.choices?.[0]?.message?.content?.trim();
    if (!texte) {
      res.status(502).json({ erreur: "Réponse Hugging Face vide.", mode: "local" });
      return;
    }

    res.status(200).json({ texte, modele, mode: "hf" });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(502).json({ erreur: message, mode: "local" });
  }
}
