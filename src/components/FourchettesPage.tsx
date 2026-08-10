import { useMemo, useState } from "react";
import type { JeuDeDonnees, ResultatAnalyse } from "../lib/types";
import { formatEuros } from "../lib/engine";
import { referentielMarche, positionSurMarche, libellePosition, REGIONS, type RegionMarche } from "../lib/marcheSalarial";
import { Section, Badge, Banner } from "./ui";
import { IconDownload, IconInfo } from "./icons";

interface Fourchette {
  poste: string;
  bas: number;
  haut: number;
  mediane: number;
  effectif: number;
  ancienneteMoyenne: number;
}

/** Construit une fourchette ±15% autour de la médiane du poste, bornée par le min/max observé. */
function calculerFourchettes(jeu: JeuDeDonnees): Fourchette[] {
  const parPoste = new Map<string, { salaires: number[]; anciennetes: number[] }>();
  for (const e of jeu.employes) {
    const entry = parPoste.get(e.poste) ?? { salaires: [], anciennetes: [] };
    entry.salaires.push(e.salaireAnnuel);
    entry.anciennetes.push(e.anciennete);
    parPoste.set(e.poste, entry);
  }
  return [...parPoste.entries()]
    .map(([poste, { salaires, anciennetes }]) => {
      const tri = [...salaires].sort((a, b) => a - b);
      const med = tri[Math.floor(tri.length / 2)];
      const min = tri[0];
      const max = tri[tri.length - 1];
      return {
        poste,
        effectif: salaires.length,
        mediane: med,
        bas: Math.max(min, Math.round(med * 0.85)),
        haut: Math.min(max, Math.round(med * 1.15)),
        ancienneteMoyenne: anciennetes.length ? anciennetes.reduce((s, v) => s + v, 0) / anciennetes.length : 0,
      };
    })
    .sort((a, b) => a.bas - b.bas);
}

export function FourchettesPage({ jeu, resultat }: { jeu: JeuDeDonnees; resultat: ResultatAnalyse }) {
  const [marge, setMarge] = useState(15);
  const [copie, setCopie] = useState(false);
  const [region, setRegion] = useState<RegionMarche>("province");

  const fourchettes = useMemo(() => calculerFourchettes(jeu), [jeu]);
  const marches = useMemo(
    () =>
      new Map(
        fourchettes.map((f) => [f.poste, referentielMarche(f.poste, region, f.ancienneteMoyenne)]),
      ),
    [fourchettes, region],
  );

  const appliquerMarge = (f: Fourchette): { bas: number; haut: number } => {
    const coef = marge / 100;
    return {
      bas: Math.round(f.mediane * (1 - coef) / 100) * 100,
      haut: Math.round(f.mediane * (1 + coef) / 100) * 100,
    };
  };

  const textePourPublication = () => {
    const lignes = fourchettes.map((f) => {
      const { bas, haut } = appliquerMarge(f);
      return `${f.poste} : ${formatEuros(bas)} - ${formatEuros(haut)} (médiane ${formatEuros(f.mediane)}, ${f.effectif} salarié${f.effectif > 1 ? "s" : ""})`;
    });
    return (
      `Fourchettes salariales — ${jeu.societe.nom} (exercice ${jeu.societe.exercice})\n` +
      `Conformes à la directive (UE) 2023/970, art. 5 — fourchette ±${marge} % autour de la médiane du poste.\n\n` +
      lignes.join("\n")
    );
  };

  const copier = async () => {
    try {
      await navigator.clipboard.writeText(textePourPublication());
      setCopie(true);
      setTimeout(() => setCopie(false), 2000);
    } catch {
      /* silencieux */
    }
  };

  const exporterTxt = () => {
    const blob = new Blob(["\uFEFF" + textePourPublication()], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "fourchettes-salariales.txt";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <header className="page-head">
        <h1>Fourchettes salariales</h1>
        <p>
          Depuis le 7 juin 2026 (directive 2023/970, art. 5), chaque offre d'emploi doit indiquer la fourchette de salaire initiale.
          Générez ici des fourchettes par poste, à insérer dans vos annonces.
        </p>
      </header>

      <Section title="Paramètres">
        <div className="grid-2">
          <div className="field">
            <label htmlFor="marge">Marge autour de la médiane : ±{marge} %</label>
            <input
              id="marge"
              type="range"
              min={5}
              max={30}
              step={1}
              value={marge}
              onChange={(e) => setMarge(Number(e.target.value))}
              style={{ width: "100%" }}
            />
            <div className="hint">
              Une fourchette étroite (±10 %) est plus transparente mais moins flexible ; ±20 % laisse de la négociation.
            </div>
          </div>
          <div className="field">
            <label htmlFor="region">Région du benchmark salarial</label>
            <select
              id="region"
              className="select"
              value={region}
              onChange={(e) => setRegion(e.target.value as RegionMarche)}
            >
              {REGIONS.map((r) => (
                <option key={r.code} value={r.code}>
                  {r.libelle}
                </option>
              ))}
            </select>
            <div className="hint">Références indicatives de marché (médianes P25/P50/P75), ajustées de l'ancienneté moyenne de chaque poste.</div>
          </div>
        </div>
        <div className="mt-3" style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button className="btn btn-primary" onClick={copier}>
            {copie ? "Copié !" : "Copier pour publication"}
          </button>
          <button className="btn" onClick={exporterTxt}>
            <IconDownload size={16} /> Exporter (.txt)
          </button>
        </div>
      </Section>

      <Section title="Fourchettes par poste">
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>Poste</th>
                <th className="num">Effectif</th>
                <th className="num">Médiane société</th>
                <th className="num">Marché P25/P50/P75</th>
                <th>Position</th>
                <th className="num">Fourchette à publier</th>
                <th>Largeur</th>
              </tr>
            </thead>
            <tbody>
              {fourchettes.map((f) => {
                const { bas, haut } = appliquerMarge(f);
                const largeur = haut - bas;
                const marche = marches.get(f.poste) ?? null;
                const position = marche ? positionSurMarche(f.mediane, marche) : null;
                return (
                  <tr key={f.poste}>
                    <td style={{ fontWeight: 600 }}>{f.poste}</td>
                    <td className="num">{f.effectif}</td>
                    <td className="num">{formatEuros(f.mediane)}</td>
                    <td className="num">
                      {marche ? (
                        <span title={marche.note}>
                          {formatEuros(marche.p25)} / {formatEuros(marche.p50)} / {formatEuros(marche.p75)}
                        </span>
                      ) : (
                        <span className="muted">—</span>
                      )}
                    </td>
                    <td>
                      {position !== null && (
                        <Badge
                          niveau={
                            position < 0.35 ? "attention" : position <= 0.65 ? "ok" : "neutral"
                          }
                        >
                          {libellePosition(position)}
                        </Badge>
                      )}
                    </td>
                    <td className="num" style={{ fontWeight: 650 }}>
                      {formatEuros(bas)} — {formatEuros(haut)}
                    </td>
                    <td>
                      <Badge niveau={largeur <= 10000 ? "ok" : "attention"}>{formatEuros(largeur)}</Badge>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="mt-4">
          <Banner niveau="attention" icon={<IconInfo size={20} />} title="Le benchmark nourrit vos fourchettes">
            Croisez la médiane société et la médiane de marché : si un poste est sous le marché (position « Sous le marché »), votre
            fourchette risque d'être non attractive — élargissez-la vers le haut ou ajustez la rémunération au recrutement. Les
            références sont indicatives (enquêtes publiques) ; pour un usage production, abonnez-vous à une source payante.
          </Banner>
        </div>
        <p className="muted small mt-3">
          Ajustez la fourchette en fonction de l'ancienneté, du lieu et de la rareté du profil. La fourchette publiée ne doit pas exclure
          les rémunérations effectivement versées sur le poste.
        </p>
        {resultat.postesComparables.length === 0 && (
          <p className="muted small mt-3">Astuce : renseignez des postes mixtes pour croiser fourchettes et écarts à travail comparable.</p>
        )}
      </Section>
    </>
  );
}
