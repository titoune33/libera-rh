import type { ReactNode } from "react";

export function Section({ title, children, action }: { title?: string; children: ReactNode; action?: ReactNode }) {
  return (
    <section className="section">
      {title && (
        <div className="flex-between mb-4">
          <h2>{title}</h2>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

export function StatCard({ label, value, sub, children }: { label: string; value: ReactNode; sub?: ReactNode; children?: ReactNode }) {
  return (
    <div className="stat-card">
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}</div>
      {sub && <div className="stat-sub">{sub}</div>}
      {children}
    </div>
  );
}

type Niveau = "ok" | "attention" | "critique";

export function Badge({ niveau, children }: { niveau: Niveau | "neutral"; children: ReactNode }) {
  const classe =
    niveau === "ok" ? "badge-ok" : niveau === "attention" ? "badge-warn" : niveau === "critique" ? "badge-danger" : "badge-neutral";
  return <span className={`badge ${classe}`}>{children}</span>;
}

export function Banner({ niveau, icon, title, children }: { niveau: Niveau; icon?: ReactNode; title: string; children: ReactNode }) {
  return (
    <div className="banner" data-niveau={niveau} role="alert">
      <div className="banner-icon">{icon}</div>
      <div>
        <div className="banner-title">{title}</div>
        <div className="banner-body">{children}</div>
      </div>
    </div>
  );
}

export function Bar({ valeur, niveau }: { valeur: number; niveau?: Niveau }) {
  const clamped = Math.max(0, Math.min(100, valeur));
  return (
    <div className="bar-track" role="img" aria-label={`${clamped.toFixed(0)} %`}>
      <div className="bar-fill" style={{ width: `${clamped}%` }} data-niveau={niveau} />
    </div>
  );
}

export function KpiBadge({ children }: { children: ReactNode }) {
  return <span className="badge badge-neutral">{children}</span>;
}
