import { useCallback, useEffect, useMemo, useState } from "react";
import type { JeuDeDonnees } from "../lib/types";
import type { Utilisateur } from "../lib/authClient";
import { formatEuros } from "../lib/engine";
import { referentielMarche, positionSurMarche, libellePosition, REGIONS } from "../lib/marcheSalarial";
import {
  apercuBenchmark,
  soumettreBenchmark,
  chargerStats,
  type RegionBenchmark,
  type StatsBenchmark,
  type PointBenchmark,
} from "../lib/benchmarkClient";
import { Section, Badge, Banner } from "./ui";
import { IconInfo, IconAlert, IconCheck, IconTrending } from "./icons";

type Plan = "gratuit" | "pro" | "entreprise" | null;

interface PointPropose {
  poste: string;
  salaire: number;
  anciennete: number;
  effectif: number;
}

/** Points de contribution proposés depuis le jeu de données courant (médiane par poste). */
function proposerPoints(jeu: JeuDeDonnees): PointPropose[] {
  const parPoste = new Map<string, { salaires: number[]; anciennetes: number[] }>();
  for (const e of jeu.employes) {
    const g = parPoste.get(e.poste) ?? { salaires: [], anciennetes: [] };
    g.salaires.push(e.salaireAnnuel);
    g.anciennetes.push(e.anciennete);
    parPoste.set(e.poste, g);
  }
  return [...parPoste.entries()].map(([poste, g]) => {
    const tri = [...g.salaires].sort((a, b) => a - b);
    return {
      poste,
      salaire: tri[Math.floor(tri.length / 2)],
      anciennete: g.anciennetes.length ? g.anciennetes.reduce((s, v) => s + v, 0) / g.anciennetes.length : 0,
      effectif: g.salaires.length,
    };
  });
}

export function BenchmarkPage({
  jeu,
  utilisateur,
  apiIndisponible,
  plan,
}: {
  jeu: JeuDeDonnees;
  utilisateur: Utilisateur | null;
  apiIndisponible: boolean;
  plan: Plan;
}) {
  const [region, setRegion] = useState<RegionBenchmark>("province");
  const [stats, setStats] = useState<StatsBenchmark | null>(null);
  const [apercu, setApercu] = useState<{ points: number; postes: number } | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [message, setMessage] = useState<{ niveau: "ok" | "attention" | "critique"; texte: string } | null>(null);
  const [chargement, setChargement] = useState(false);

  const pointsProposes = useMemo(() => proposerPoints(jeu), [jeu]);
  const estPro = plan === "pro" || plan === "entreprise";

  const charger = useCallback(async () => {
    setErreur(null);
    if (!utilisateur) {
      try {
        setApercu(await apercuBenchmark());
      } catch {
        setApercu(null);
      }
      return;
    }
    try {
      const s = await chargerStats(region);
      setStats(s);
    } catch (err) {
      setErreur(err instanceof Error ? err.message : "Erreur inconnue.");
    }
  }, [utilisateur, region]);

  useEffect(() => {
    void charger();
  }, [charger]);

  const participer = async () => {
    if (!utilisateur) return;
    setMessage(null);
    setErreur(null);
    const points: PointBenchmark[] = pointsProposes.map((p) => ({
      poste: p.poste,
      salaire: p.salaire,
      anciennete: p.anciennete,
      region,
    }));
    setChargement(true);
    try {
      const rep = await soumettreBenchmark(points);
      setMessage({
        niveau: "ok",
        texte: `${rep.envoyes} point(s) anonyme(s) ajouté(s) au benchmark. ${rep.quotaRestant} contribution(s) restante(s) aujourd'hui.`,
      });
      void charger();
    } catch (err) {
      setMessage({ niveau: "critique", texte: err instanceof Error ? err.message : "Erreur lors de la contribution." });
    } finally {
      setChargement(false);
    }
  };

  const medianeSociete = (poste: string): { salaire: number; effectif: number; anciennete: number } | null => {
    const cle = poste.toLowerCase().trim();
    for (const p of pointsProposes) {
      if (p.poste.toLowerCase().trim() === cle) return { salaire: p.salaire, effectif: p.effectif, anciennete: p.anciennete };
    }
    return null;
  };

  return (
    <>
      <header className="page-head">
        <h1>Benchmark salarial</h1>
        <p>
          Comparez vos salaires au <strong>marché réel</strong> : le benchmark agrège anonymement les contributions des
          entreprises utilisatrices (poste, salaire, ancienneté, région) et les croise avec les références publiques.
        </p>
      </header>

      {erreur && (
        <div className="mt-3">
          <Banner niveau="critique" icon={<IconAlert size={20} />} title="Erreur">
            {erreur}
          </Banner>
        </div>
      )}
      {message && (
        <div className="mt-3">
          <Banner
            niveau={message.niveau}
            icon={message.niveau === "ok" ? <IconCheck size={20} /> : <IconAlert size={20} />}
            title="Benchmark"
          >
            {message.texte}
          </Banner>
        </div>
      )}

      {!utilisateur && (
        <Banner niveau="attention" icon={<IconInfo size={20} />} title="Connectez-vous pour participer">
          {apiIndisponible
            ? "L'API n'est pas accessible en mode démo locale. Ouvrez la version déployée (freebuf.vercel.app) et connectez-vous pour contribuer."
            : "Créez un compte gratuit ou connectez-vous : votre contribution est anonyme (seul un hash de votre email est stocké), et vous débloquez les statistiques détaillées du benchmark."}
        </Banner>
      )}

      <Section title="Participer au benchmark">
        <div className="grid-2">
          <div className="field">
            <label htmlFor="bench-region">Région de votre entreprise</label>
            <select id="bench-region" className="select" value={region} onChange={(e) => setRegion(e.target.value as RegionBenchmark)}>
              {REGIONS.map((r) => (
                <option key={r.code} value={r.code}>
                  {r.libelle}
                </option>
              ))}
            </select>
            <div className="hint">Les salaires Île-de-France sont en moyenne plus élevés : la région est prise en compte dans les comparaisons.</div>
          </div>
          <div className="field">
            <label>Contribution proposée (médiane par poste)</label>
            <div className="hint">
              {pointsProposes.length > 0
                ? `${pointsProposes.length} poste(s) · ${pointsProposes.reduce((s, p) => s + p.effectif, 0)} salariés couverts. Aucune donnée nominative n'est envoyée.`
                : "Chargez d'abord des données (Données & import) pour pouvoir contribuer."}
            </div>
          </div>
        </div>

        {pointsProposes.length > 0 && (
          <div className="table-wrap mt-3">
            <table className="data">
              <thead>
                <tr>
                  <th>Poste</th>
                  <th className="num">Effectif</th>
                  <th className="num">Médiane société</th>
                  <th className="num">Ancienneté moy.</th>
                </tr>
              </thead>
              <tbody>
                {pointsProposes.map((p) => (
                  <tr key={p.poste}>
                    <td style={{ fontWeight: 600 }}>{p.poste}</td>
                    <td className="num">{p.effectif}</td>
                    <td className="num">{formatEuros(p.salaire)}</td>
                    <td className="num">{p.anciennete.toFixed(1)} ans</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="mt-3" style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          <button className="btn btn-primary" onClick={participer} disabled={chargement || !utilisateur || pointsProposes.length === 0}>
            <IconTrending size={16} />
            {chargement ? "Envoi…" : `Contribuer anonymement (${pointsProposes.length} point${pointsProposes.length > 1 ? "s" : ""})`}
          </button>
          {utilisateur && stats && (
            <span className="muted small">
              {stats.quota.envoyes}/{stats.quota.max} contribution(s) aujourd'hui
            </span>
          )}
        </div>
      </Section>

      <Section title="Benchmark en direct">
        {!utilisateur && (
          <>
            <p className="muted small">
              {apercu
                ? `Le benchmark communautaire compte déjà ${apercu.points} salaire(s) anonyme(s) sur ${apercu.postes} poste(s). Connectez-vous pour voir les statistiques détaillées.`
                : "Le benchmark communautaire se nourrit des contributions des entreprises utilisatrices."}
            </p>
            <div className="mt-3">
              <Banner niveau="attention" icon={<IconInfo size={20} />} title="Résultats réservés aux comptes connectés">
                <a href="/app?connexion=1" style={{ color: "var(--c-primary)", fontWeight: 600, textDecoration: "underline" }}>
                  Créer un compte gratuit
                </a>{" "}
                pour participer et consulter les fourchettes de marché.
              </Banner>
            </div>
          </>
        )}

        {utilisateur && stats && !estPro && (
          <>
            <div className="grid-3">
              <div className="stat-card">
                <div className="stat-value">{stats.totalPoints}</div>
                <div className="stat-label">salaires anonymes collectés</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{stats.totalPostes}</div>
                <div className="stat-label">postes couverts</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{stats.medianeGlobale ? formatEuros(stats.medianeGlobale) : "—"}</div>
                <div className="stat-label">médiane globale</div>
              </div>
            </div>
            {stats.topPostes && stats.topPostes.length > 0 && (
              <div className="table-wrap mt-3">
                <table className="data">
                  <thead>
                    <tr>
                      <th>Poste</th>
                      <th className="num">Échantillon</th>
                      <th className="num">Médiane marché</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.topPostes.map((t) => (
                      <tr key={t.poste}>
                        <td style={{ fontWeight: 600 }}>{t.poste}</td>
                        <td className="num">{t.effectif}</td>
                        <td className="num">{formatEuros(t.mediane)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <div className="mt-3">
              <Banner niveau="attention" icon={<IconInfo size={20} />} title="Fourchettes détaillées réservées à Pro">
                Le plan Pro débloque les percentiles P25/P50/P75 par poste et par région, et le croisement avec la position de
                votre société.{" "}
                <a href="/app?abonnement=1" style={{ color: "var(--c-primary)", fontWeight: 600, textDecoration: "underline" }}>
                  Passer à Pro — 49 €/mois
                </a>
              </Banner>
            </div>
          </>
        )}

        {utilisateur && stats && estPro && (
          <>
            <p className="muted small">
              {stats.totalPoints} salaire(s) anonyme(s) · {stats.totalPostes} poste(s) · région :{" "}
              {stats.region === "idf" ? "Île-de-France" : stats.region === "province" ? "France (hors IDF)" : "toutes"}.
              Un poste n'apparaît qu'à partir de 3 contributions.
            </p>
            {stats.postes && stats.postes.length > 0 ? (
              <div className="table-wrap mt-3">
                <table className="data">
                  <thead>
                    <tr>
                      <th>Poste</th>
                      <th className="num">n</th>
                      <th className="num">P25</th>
                      <th className="num">P50 (médiane)</th>
                      <th className="num">P75</th>
                      <th className="num">Votre médiane</th>
                      <th>Position vs marché</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.postes.map((p) => {
                      const moi = medianeSociete(p.poste);
                      const marche = moi ? referentielMarche(p.poste, region, moi.anciennete) : null;
                      const position = marche && moi ? positionSurMarche(moi.salaire, marche) : null;
                      return (
                        <tr key={`${p.poste}-${p.region}`}>
                          <td style={{ fontWeight: 600 }}>{p.poste}</td>
                          <td className="num">{p.effectif}</td>
                          <td className="num">{formatEuros(p.p25)}</td>
                          <td className="num" style={{ fontWeight: 650 }}>{formatEuros(p.p50)}</td>
                          <td className="num">{formatEuros(p.p75)}</td>
                          <td className="num">{moi ? formatEuros(moi.salaire) : <span className="muted">—</span>}</td>
                          <td>
                            {position !== null ? (
                              <Badge niveau={position < 0.35 ? "attention" : position <= 0.65 ? "ok" : "neutral"}>
                                {libellePosition(position)}
                              </Badge>
                            ) : (
                              <span className="muted small">—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="muted">
                Pas encore assez de données (minimum 3 contributions par poste). Contribuez avec vos salaires pour lancer le
                benchmark — plus il y a de participants, plus les fourchettes sont fiables.
              </p>
            )}
            <div className="mt-4">
              <Banner niveau="attention" icon={<IconInfo size={20} />} title="Comment lire ce tableau">
                Le benchmark croise trois sources : les salaires anonymes des entreprises utilisatrices (colonnes P25/P50/P75),
                la médiane de votre société, et le référentiel de marché public (P25/P50/P75) disponible dans « Fourchettes
                salariales ». Si un poste est « Sous le marché », votre fourchette de recrutement risque d'être non attractive.
              </Banner>
            </div>
          </>
        )}
      </Section>
    </>
  );
}
