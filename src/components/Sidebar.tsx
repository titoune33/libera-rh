import type { ComponentType } from "react";
import type { PageId } from "../AppShell";
import type { Utilisateur } from "../lib/authClient";
import type { EtatAbonnement } from "../lib/abonnementClient";
import { Logo } from "./Logo";
import {
  IconDashboard,
  IconUpload,
  IconChart,
  IconDoc,
  IconScale,
  IconShield,
  IconTrending,
  IconCheck,
  IconFolder,
  IconUsers,
  IconCard,
  IconGlobe,
  IconHeart,
} from "./icons";

const NAV: { id: PageId; label: string; icon: ComponentType<{ size?: number; className?: string }>; admin?: boolean }[] = [
  { id: "dashboard", label: "Tableau de bord", icon: IconDashboard },
  { id: "import", label: "Données & import", icon: IconUpload },
  { id: "analyse", label: "Analyse des écarts", icon: IconChart },
  { id: "index", label: "Index d'égalité complet", icon: IconCheck },
  { id: "rapport", label: "Rapport conforme", icon: IconDoc },
  { id: "fourchettes", label: "Fourchettes salariales", icon: IconScale },
  { id: "benchmark", label: "Benchmark salarial", icon: IconGlobe },
  { id: "rattrapage", label: "Plan de rattrapage", icon: IconTrending },
  { id: "attrition", label: "Risque de départ", icon: IconHeart },
  { id: "dossiers", label: "Dossiers & partage", icon: IconFolder },
  { id: "conformite", label: "Guide de conformité", icon: IconShield },
  { id: "abonnement", label: "Abonnement", icon: IconCard },
  { id: "admin", label: "Administration", icon: IconUsers, admin: true },
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
  abo,
}: {
  page: PageId;
  onNavigate: (p: PageId) => void;
  effectif: number;
  utilisateur: Utilisateur | null;
  connecte: boolean;
  apiIndisponible: boolean;
  onSeConnecter: () => void;
  onSeDeconnecter: () => void;
  abo: EtatAbonnement | null;
}) {
  const estAdmin = utilisateur?.role === "admin";
  const liens = NAV.filter((item) => !item.admin || estAdmin);

  return (
    <aside className="sidebar" aria-label="Navigation principale">
      <div className="brand">
        <Logo size={32} tagline="Conformité salariale" />
      </div>

      <nav className="nav" aria-label="Sections">
        <div className="nav-label">Pilotage</div>
        {liens.map((item) => {
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
                {estAdmin && (
                  <span
                    className="badge badge-admin"
                    style={{ marginLeft: 8, fontSize: 11, fontWeight: 700, color: "#7c3aed", background: "rgba(139,92,246,.12)" }}
                  >
                    Admin
                  </span>
                )}
              </div>
              <div style={{ fontSize: 11.5, color: "var(--c-text-faint)", overflow: "hidden", textOverflow: "ellipsis" }} title={utilisateur.email}>
                {utilisateur.email}
              </div>
              {abo && (
                <div style={{ fontSize: 12, margin: "2px 0 4px" }}>
                  <span className="badge" data-plan={abo.plan} style={{
                    background: abo.plan === "pro" || abo.plan === "entreprise" ? "rgba(16,185,129,.12)" : "rgba(148,163,184,.12)",
                    color: abo.plan === "pro" || abo.plan === "entreprise" ? "#059669" : "#64748b",
                    fontWeight: 600,
                  }}>
                    {abo.plan === "gratuit" ? "Gratuit" : abo.plan === "pro" ? "Pro" : "Entreprise"}
                  </span>
                  {abo.plan === "gratuit" && (
                    <a
                      href="#abonnement"
                      onClick={(e) => { e.preventDefault(); onNavigate("abonnement"); }}
                      style={{ marginLeft: 6, fontSize: 11.5, color: "var(--c-primary)", textDecoration: "none" }}
                    >
                      Passer à Pro
                    </a>
                  )}
                </div>
              )}
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
