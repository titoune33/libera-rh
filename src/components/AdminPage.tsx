import { useCallback, useEffect, useState } from "react";
import type { Utilisateur } from "../lib/authClient";
import { Banner, Section, StatCard } from "./ui";
import { IconShield, IconAlert } from "./icons";

interface UserAdmin {
  email: string;
  nom: string;
  role: "admin" | "utilisateur";
  provider: string;
  creeLe: string;
  sauvegardes: number;
}

interface StatsAdmin {
  compteurs: { utilisateurs: number; sauvegardes: number; dossiers: number; sessions: number };
  integrations: { huggingFace: boolean; airtable: boolean; google: boolean; github: boolean };
  activite: { nom: string; exercice: string; maj: string; email: string }[];
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

export function AdminPage({ utilisateur }: { utilisateur: Utilisateur | null }) {
  const [onglet, setOnglet] = useState<"utilisateurs" | "integrations">("utilisateurs");
  const [users, setUsers] = useState<UserAdmin[]>([]);
  const [stats, setStats] = useState<StatsAdmin | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [chargement, setChargement] = useState(false);

  const charger = useCallback(async () => {
    setErreur(null);
    setChargement(true);
    try {
      const [u, s] = await Promise.all([
        appel<{ liste: UserAdmin[] }>("/api/admin/utilisateurs"),
        appel<StatsAdmin>("/api/admin/stats"),
      ]);
      setUsers(u.liste);
      setStats(s);
    } catch (err) {
      setErreur(err instanceof Error ? err.message : "Erreur inconnue.");
    } finally {
      setChargement(false);
    }
  }, []);

  useEffect(() => {
    void charger();
  }, [charger, onglet]);

  const changerRole = async (email: string, role: "admin" | "utilisateur") => {
    setMessage(null);
    try {
      await appel("/api/admin/utilisateurs", "PATCH", { email, role });
      setMessage(`Rôle de ${email} mis à jour (${role}).`);
      void charger();
    } catch (err) {
      setErreur(err instanceof Error ? err.message : "Erreur.");
    }
  };

  const supprimer = async (email: string) => {
    if (!window.confirm(`Supprimer définitivement le compte ${email} (sauvegardes et sessions incluses) ?`)) return;
    setMessage(null);
    try {
      await appel("/api/admin/utilisateurs", "DELETE", { email });
      setMessage(`Compte ${email} supprimé.`);
      void charger();
    } catch (err) {
      setErreur(err instanceof Error ? err.message : "Erreur.");
    }
  };

  const nonAdmin = !utilisateur || utilisateur.role !== "admin";

  return (
    <>
      <header className="page-head">
        <h1>Administration</h1>
        <p>
          Panneau réservé aux administrateurs : gestion des comptes, des rôles et état des intégrations (Hugging Face, Airtable,
          connexions sociales).
        </p>
      </header>

      {nonAdmin && (
        <Banner niveau="critique" icon={<IconAlert size={20} />} title="Accès réservé aux administrateurs">
          Connectez-vous avec un compte administrateur pour accéder à cette page.
        </Banner>
      )}

      {erreur && (
        <div className="mt-3">
          <Banner niveau="attention" icon={<IconAlert size={20} />} title="Erreur">
            {erreur}
          </Banner>
        </div>
      )}
      {message && (
        <div className="mt-3">
          <Banner niveau="ok" icon={<IconShield size={20} />} title="Opération réussie">
            {message}
          </Banner>
        </div>
      )}

      {!nonAdmin && !erreur && (
        <>
          <div className="login-tabs" role="tablist" aria-label="Sections d'administration" style={{ maxWidth: 420 }}>
            <button
              type="button"
              role="tab"
              aria-selected={onglet === "utilisateurs"}
              className={onglet === "utilisateurs" ? "login-tab login-tab-active" : "login-tab"}
              onClick={() => setOnglet("utilisateurs")}
            >
              Utilisateurs
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={onglet === "integrations"}
              className={onglet === "integrations" ? "login-tab login-tab-active" : "login-tab"}
              onClick={() => setOnglet("integrations")}
            >
              Intégrations & stats
            </button>
          </div>

          {chargement && <p className="muted small" style={{ marginTop: 16 }}>Chargement…</p>}

          {onglet === "utilisateurs" && !chargement && (
            <Section title={`Comptes (${users.length})`}>
              <div className="table-wrap">
                <table className="data">
                  <thead>
                    <tr>
                      <th>Nom</th>
                      <th>Email</th>
                      <th>Rôle</th>
                      <th>Connexion</th>
                      <th className="num">Sauvegardes</th>
                      <th>Inscrit le</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u.email}>
                        <td style={{ fontWeight: 600 }}>{u.nom}</td>
                        <td>{u.email}</td>
                        <td>
                          <span className={`badge ${u.role === "admin" ? "badge-admin" : ""}`}>
                            {u.role === "admin" ? "Admin" : "Utilisateur"}
                          </span>
                        </td>
                        <td>{u.provider ? (u.provider === "google" ? "Google" : u.provider === "github" ? "GitHub" : u.provider) : "Email"}</td>
                        <td className="num">{u.sauvegardes}</td>
                        <td>{u.creeLe ? new Date(u.creeLe).toLocaleDateString("fr-FR") : "—"}</td>
                        <td>
                          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                            {u.role === "admin" ? (
                              <button className="btn" onClick={() => changerRole(u.email, "utilisateur")}>
                                Retirer admin
                              </button>
                            ) : (
                              <button className="btn" onClick={() => changerRole(u.email, "admin")}>
                                Passer admin
                              </button>
                            )}
                            <button className="btn btn-danger-soft" onClick={() => supprimer(u.email)}>
                              Supprimer
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {users.length === 0 && <p className="muted small">Aucun compte pour l'instant.</p>}
            </Section>
          )}

          {onglet === "integrations" && !chargement && stats && (
            <>
              <div className="grid-stats">
                <StatCard label="Utilisateurs" value={stats.compteurs.utilisateurs} />
                <StatCard label="Sauvegardes" value={stats.compteurs.sauvegardes} />
                <StatCard label="Dossiers" value={stats.compteurs.dossiers} />
                <StatCard label="Sessions actives" value={stats.compteurs.sessions} />
              </div>

              <Section title="État des intégrations">
                <div className="grid-stats">
                  {(
                    [
                      ["Hugging Face (IA)", stats.integrations.huggingFace],
                      ["Airtable (stockage)", stats.integrations.airtable],
                      ["Google (connexion)", stats.integrations.google],
                      ["GitHub (connexion)", stats.integrations.github],
                    ] as const
                  ).map(([label, ok]) => (
                    <div key={label} className="integration-card">
                      <span className={`dot ${ok ? "dot-ok" : "dot-off"}`} aria-hidden="true" />
                      <div>
                        <strong>{label}</strong>
                        <div className="muted small">{ok ? "Configurée" : "Non configurée"}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </Section>

              <Section title="Activité récente (sauvegardes)">
                <div className="table-wrap">
                  <table className="data">
                    <thead>
                      <tr>
                        <th>Société</th>
                        <th className="num">Exercice</th>
                        <th>Compte</th>
                        <th>Mise à jour</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.activite.map((a, i) => (
                        <tr key={i}>
                          <td style={{ fontWeight: 600 }}>{a.nom}</td>
                          <td className="num">{a.exercice}</td>
                          <td>{a.email}</td>
                          <td>{a.maj ? new Date(a.maj).toLocaleString("fr-FR") : "—"}</td>
                        </tr>
                      ))}
                      {stats.activite.length === 0 && (
                        <tr>
                          <td colSpan={4} className="muted">
                            Aucune sauvegarde récente.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </Section>
            </>
          )}
        </>
      )}
    </>
  );
}
