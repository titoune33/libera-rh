// Client de l'API benchmark salarial communautaire (/api/benchmark).

export type RegionBenchmark = "province" | "idf";

export interface PointBenchmark {
  poste: string;
  salaire: number;
  anciennete: number;
  region: RegionBenchmark;
}

export interface PosteAgrege {
  poste: string;
  region: string;
  effectif: number;
  p25: number;
  p50: number;
  p75: number;
}

export interface StatsBenchmark {
  plan: "gratuit" | "pro";
  totalPoints: number;
  totalPostes: number;
  medianeGlobale: number | null;
  region?: string;
  postes?: PosteAgrege[];
  topPostes?: { poste: string; effectif: number; mediane: number }[];
  quota: { envoyes: number; max: number };
}

export interface ApercuBenchmark {
  points: number;
  postes: number;
}

async function appel<T>(chemin: string, methode = "GET", corps?: unknown): Promise<T> {
  const rep = await fetch(chemin, {
    method: methode,
    headers: corps === undefined ? undefined : { "Content-Type": "application/json" },
    body: corps === undefined ? undefined : JSON.stringify(corps),
  });
  const data = (await rep.json().catch(() => null)) as T & { erreur?: string };
  if (!rep.ok) {
    throw new Error(data?.erreur ?? `Erreur ${rep.status}`);
  }
  return data;
}

export function apercuBenchmark(): Promise<ApercuBenchmark> {
  return appel<ApercuBenchmark>("/api/benchmark?route=apercu");
}

export function soumettreBenchmark(points: PointBenchmark[]): Promise<{ ok: boolean; envoyes: number; quotaRestant: number }> {
  return appel("/api/benchmark?route=soumettre", "POST", { points });
}

export function chargerStats(region: RegionBenchmark | null): Promise<StatsBenchmark> {
  return appel<StatsBenchmark>(`/api/benchmark?route=stats${region ? `&region=${region}` : ""}`);
}
