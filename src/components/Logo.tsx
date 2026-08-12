import { useId } from "react";

/**
 * Marque « Équitia » : tuile arrondie en dégradé indigo-violet portant une
 * balance stylisée (symbole d'égalité de rémunération). SVG inline, sans
 * dépendance, id de gradient unique par instance (React useId).
 */
export function LogoMark({ size = 32, className }: { size?: number; className?: string }) {
  const rawId = useId();
  const grad = `eq-grad-${rawId.replace(/[^a-zA-Z0-9]/g, "")}`;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      className={className}
      role="img"
      aria-label="Logo Équitia"
      style={{ flexShrink: 0 }}
    >
      <defs>
        <linearGradient id={grad} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#8B5CF6" />
          <stop offset="55%" stopColor="#6366F1" />
          <stop offset="100%" stopColor="#4F46E5" />
        </linearGradient>
      </defs>
      <rect x="2" y="2" width="44" height="44" rx="13" fill={`url(#${grad})`} />
      {/* Balance : fléau, bras, plateaux et socle */}
      <path d="M24 13v19" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" fill="none" />
      <path d="M24 13l-10 5.5" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" fill="none" />
      <path d="M24 13l10 5.5" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" fill="none" />
      <path d="M14 18.5l-2.7 6.2a3.8 3.8 0 0 0 6.7 0Z" stroke="#fff" strokeWidth="2.4" strokeLinejoin="round" fill="none" />
      <path d="M34 18.5l-2.7 6.2a3.8 3.8 0 0 0 6.7 0Z" stroke="#fff" strokeWidth="2.4" strokeLinejoin="round" fill="none" />
      <path d="M13 40h22" stroke="rgba(255,255,255,.85)" strokeWidth="2.4" strokeLinecap="round" fill="none" />
    </svg>
  );
}

/** Mot-symbole complet : tuile + nom « Équitia ». */
export function Logo({
  size = 30,
  className,
  tagline,
}: {
  size?: number;
  className?: string;
  tagline?: string;
}) {
  return (
    <span className={`logo${className ? ` ${className}` : ""}`} style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
      <LogoMark size={size} />
      <span style={{ display: "grid", lineHeight: 1.15 }}>
        <span
          style={{
            fontWeight: 800,
            letterSpacing: "-0.02em",
            fontSize: Math.round(size * 0.62),
            color: "inherit",
          }}
        >
          Équitia
        </span>
        {tagline && (
          <span
            className="logo-tagline"
            style={{
              fontSize: Math.round(size * 0.3),
              fontWeight: 600,
              opacity: 0.62,
              letterSpacing: "0.02em",
            }}
          >
            {tagline}
          </span>
        )}
      </span>
    </span>
  );
}
