import type { ComponentType } from "react";
import type { PageId } from "../AppShell";
import type { Utilisateur } from "../lib/authClient";
import { IconDashboard, IconUpload, IconChart, IconDoc, IconScale, IconShield, IconTrending, IconCheck } from "./icons";

const NAV: { id: PageId; label: string; icon: ComponentType<{ size?: number; className?: string }> }[] = [
  { id: "dashboard", label: "Tableau de bord", icon: IconDashboard },
  { id: "import", label: "Données & import", icon: IconUpload },
  { id: "analyse", label: "Analyse des écarts", icon: IconChart },
  { id: "index", label: "Index d'égalité complet", icon: IconCheck },
  { id: "rapport", label: "Rapport conforme", icon: IconDoc },
  { id: "fourchettes", label: "Fourchettes salariales", icon: IconScale },
  { id: "rattrapage", label: "Plan de rattrapage", icon: IconTrending },
  { id: "conformite", label: "Guide de conformité", icon: IconShield },
];

export function Sidebar({
  page,
  onNavigate,
  effectif,
  utilisateur,
  connecte,
  apiIndisponible,
  onSeConnecter,
  onSeDeconnecter,
}: {
  page: PageId;
  onNavigate: (p: PageId) => void;
  effectif: number;
  utilisateur: Utilisateur | null;
  connecte: boolean;
  apiIndisponible: boolean;
  onSeConnecter: () => void;
  onSeDeconnecter: () => void;
}) {
  return (
    <aside className="sidebar" aria-label="Navigation principale">
      <div className="brand">
        <span className="brand-logo" aria-hidden="true">
          <IconScale size={18} />
        </span>
        <div>
          <div className="brand-name">Équilibre</div>
          <div className="brand-tag">Transparence salariale</div>
        </div>
      </div>

      <nav className="nav" aria-label="Sections">
        <div className="nav-label">Pilotage</div>
        {NAV.map((item) => {
          const Icon = item.icon;
          const courant = page === item.id;
          return (
            <a
              key={item.id}
              className="nav-link"
              href={`#${item.id}`}
              aria-current={courant ? "page" : undefined}
              onClick={(e) => {
                e.preventDefault();
                onNavigate(item.id);
              }}
            >
              <Icon size={18} />
              <span>{item.label}</span>
            </a>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <div style={{ fontWeight: 600, marginBottom: 4 }}>Base de conformité</div>
        Directive (UE) 2023/970 · Index égalité · AI Act
        <div style={{ marginTop: 8, fontSize: 12 }}>
          {effectif > 0 ? `${effectif} salariés chargés` : "Aucune donnée chargée"}
        </div>
        <div
          style={{
            marginTop: 12,
            paddingTop: 12,
            borderTop: "1px solid var(--c-border)",
            display: "grid",
            gap: 8,
          }}
        >
          {connecte && utilisateur ? (
            <>
              <div style={{ fontSize: 12.5, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis" }} title={utilisateur.email}>
                {utilisateur.nom}
              </div>
              <button className="btn btn-ghost" style={{ padding: "5px 10px", minHeight: 30, fontSize: 12.5 }} onClick={onSeDeconnecter}>
                Se déconnecter
              </button>
            </>
          ) : (
            <button className="btn btn-primary" style={{ padding: "7px 12px", minHeight: 34, fontSize: 13 }} onClick={onSeConnecter}>
              {apiIndisponible ? "Connexion (version en ligne)" : "Se connecter"}
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}
