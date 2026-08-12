import { useCallback, useEffect, useState } from "react";
import { predireEquipe, type ProfilEmploye, type ResultatAttrition, type ResultatEquipe } from "../../modules/attrition/src/index.js";

const EXEMPLES: ProfilEmploye[] = [
  { nom: "Camille Martin", performance: 0.85, engagement: 0.8, satisfaction: 0.75, experienceAnnees: 6, salaire: 48_000 },
  { nom: "Hugo Bernard", performance: 0.4, engagement: 0.25, satisfaction: 0.2, experienceAnnees: 1, salaire: 31_000 },
  { nom: "Léa Petit", performance: 0.7, engagement: 0.75, satisfaction: 0.8, experienceAnnees: 4, salaire: 42_000 },
];

interface Props {
  utilisateur: { email: string; nom?: string; role?: string } | null;
  apiIndisponible: boolean;
}

const NIVEAU_BADGE: Record<string, string> = {
  stable: "badge-ok",
  faible: "badge-neutral",
  modere: "badge-warn",
  eleve: "badge-danger",
};

export function AttritionPage({ utilisateur, apiIndisponible }: Props) {
  const [profils, setProfils] = useState<ProfilEmploye[]>(EXEMPLES);
  const [equipe, setEquipe] = useState<ResultatEquipe | null>(null);
  const [chargement, setChargement] = useState(false);
  const [form, setForm] = useState({
    nom: "",
    performance: "0.7",
    engagement: "0.7",
    satisfaction: "0.7",
    experienceAnnees: "5",
    salaire: "45000",
  });

  const calculer = useCallback(
    async (liste: ProfilEmploye[]) => {
      setChargement(true);
      try {
        // API distante si connecté et disponible, sinon moteur local.
        if (utilisateur && !apiIndisponible) {
          const rep = await fetch("/api/attrition", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ employes: liste }),
          });
          if (rep.ok) {
            const data = await rep.json();
            setEquipe(data);
            return;
          }
        }
        setEquipe(predireEquipe(liste));
      } catch {
        setEquipe(predireEquipe(liste));
      } finally {
        setChargement(false);
      }
    },
    [utilisateur, apiIndisponible]
  );

  useEffect(() => {
    void calculer(profils);
  }, [calculer, profils]);

  const ajouter = (e: React.FormEvent) => {
    e.preventDefault();
    const profil: ProfilEmploye = {
      nom: form.nom || `Collaborateur ${profils.length + 1}`,
      performance: Math.min(1, Math.max(0, Number(form.performance))),
      engagement: Math.min(1, Math.max(0, Number(form.engagement))),
      satisfaction: Math.min(1, Math.max(0, Number(form.satisfaction))),
      experienceAnnees: Math.max(0, Number(form.experienceAnnees)),
      salaire: Math.max(0, Number(form.salaire)),
    };
    setProfils((p) => [...p, profil]);
    setForm((f) => ({ ...f, nom: "" }));
  };

  const supprimer = (index: number) => {
    setProfils((p) => p.filter((_, i) => i !== index));
  };

  const stats = equipe?.statistiques;

  return (
    <div className="page">
      <header className="page-head">
        <h1>Risque de départ</h1>
        <p className="small">
          Module Attrition (ex-TalentPulse · PeoplePulse) — score déterministe et explicable,
          recommandations en français. {utilisateur && !apiIndisponible ? "Calcul via l'API de la plateforme." : "Mode local (API indisponible)."}
        </p>
      </header>

      {stats && (
        <div className="grid-stats">
          <div className="stat-card">
            <div className="stat-value">{stats.effectif}</div>
            <div className="stat-label">Effectif analysé</div>
            <div className="stat-sub">profils</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{stats.aRisque}</div>
            <div className="stat-label">À risque (≥ 70 %)</div>
            <div className="stat-sub">intervention prioritaire</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{(stats.risqueMoyen * 100).toFixed(0)} %</div>
            <div className="stat-label">Risque moyen</div>
            <div className="stat-sub">sur l'équipe</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">
              <span className={`badge ${NIVEAU_BADGE[stats.niveauGlobal] ?? "badge-neutral"}`}>
                {stats.niveauGlobal}
              </span>
            </div>
            <div className="stat-label">Niveau global</div>
            <div className="stat-sub">vérifié en continu</div>
          </div>
        </div>
      )}

      <form className="head" onSubmit={ajouter} style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "end", margin: "16px 0" }}>
        <label>
          <span className="small">Nom</span>
          <input className="input" value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} placeholder="Prénom Nom" />
        </label>
        <label>
          <span className="small">Performance (0-1)</span>
          <input className="input" type="number" min={0} max={1} step={0.05} value={form.performance} onChange={(e) => setForm({ ...form, performance: e.target.value })} />
        </label>
        <label>
          <span className="small">Engagement (0-1)</span>
          <input className="input" type="number" min={0} max={1} step={0.05} value={form.engagement} onChange={(e) => setForm({ ...form, engagement: e.target.value })} />
        </label>
        <label>
          <span className="small">Satisfaction (0-1)</span>
          <input className="input" type="number" min={0} max={1} step={0.05} value={form.satisfaction} onChange={(e) => setForm({ ...form, satisfaction: e.target.value })} />
        </label>
        <label>
          <span className="small">Expérience (ans)</span>
          <input className="input" type="number" min={0} step={1} value={form.experienceAnnees} onChange={(e) => setForm({ ...form, experienceAnnees: e.target.value })} />
        </label>
        <label>
          <span className="small">Salaire (€/an)</span>
          <input className="input" type="number" min={0} step={1000} value={form.salaire} onChange={(e) => setForm({ ...form, salaire: e.target.value })} />
        </label>
        <button type="submit" className="btn btn-primary">Ajouter</button>
      </form>

      {chargement && <p className="small">Calcul en cours…</p>}

      {equipe && equipe.resultats.length > 0 && (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Collaborateur</th>
                <th>Risque</th>
                <th>Niveau</th>
                <th>Confiance</th>
                <th>Recommandation</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {equipe.resultats.map((r: ResultatAttrition, i: number) => (
                <tr key={r.nom + i}>
                  <td><strong>{r.nom}</strong></td>
                  <td>{(r.probabilite * 100).toFixed(0)} %</td>
                  <td>
                    <span className={`badge ${NIVEAU_BADGE[r.niveau] ?? "badge-neutral"}`}>{r.niveau}</span>
                  </td>
                  <td>{(r.confiance * 100).toFixed(0)} %</td>
                  <td className="small">{r.recommandation}</td>
                  <td>
                    <button type="button" className="btn btn-danger-soft" onClick={() => supprimer(i)}>Retirer</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="small" style={{ marginTop: 12 }}>
        Le score est issu de la formule déterministe du module attrition (performance, engagement,
        satisfaction, ancienneté, rémunération) — portage du modèle TalentPulse. Un assistant IA
        (llm-gateway) peut rédiger les plans d'action détaillés.
      </p>
    </div>
  );
}
