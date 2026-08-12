interface IconProps {
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}

function base(size: number = 20, className?: string, style?: React.CSSProperties) {
  return {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true as const,
    className,
    style,
  };
}

export const IconDashboard = ({ size = 20, className, style }: IconProps) => (
  <svg {...base(size, className, style)}>
    <rect x="3" y="3" width="7" height="9" rx="1.5" />
    <rect x="14" y="3" width="7" height="5" rx="1.5" />
    <rect x="14" y="12" width="7" height="9" rx="1.5" />
    <rect x="3" y="16" width="7" height="5" rx="1.5" />
  </svg>
);

export const IconUpload = ({ size = 20, className, style }: IconProps) => (
  <svg {...base(size, className, style)}>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <path d="M17 8l-5-5-5 5" />
    <path d="M12 3v12" />
  </svg>
);

export const IconChart = ({ size = 20, className, style }: IconProps) => (
  <svg {...base(size, className, style)}>
    <path d="M3 3v18h18" />
    <rect x="7" y="12" width="3" height="6" rx="0.5" />
    <rect x="13" y="8" width="3" height="10" rx="0.5" />
    <rect x="18" y="5" width="3" height="13" rx="0.5" />
  </svg>
);

export const IconDoc = ({ size = 20, className, style }: IconProps) => (
  <svg {...base(size, className, style)}>
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <path d="M14 2v6h6" />
    <path d="M9 15h6" />
    <path d="M9 11h2" />
  </svg>
);

export const IconScale = ({ size = 20, className, style }: IconProps) => (
  <svg {...base(size, className, style)}>
    <path d="M12 3v18" />
    <path d="M8 21h8" />
    <path d="M12 3 5 8" />
    <path d="M12 3l7 5" />
    <path d="M5 8l-2.5 6a3 3 0 0 0 5 0Z" />
    <path d="M19 8l-2.5 6a3 3 0 0 0 5 0Z" />
  </svg>
);

export const IconShield = ({ size = 20, className, style }: IconProps) => (
  <svg {...base(size, className, style)}>
    <path d="M12 22s8-3.5 8-10V5l-8-3-8 3v7c0 6.5 8 10 8 10z" />
    <path d="m9 12 2 2 4-4" />
  </svg>
);

export const IconAlert = ({ size = 20, className, style }: IconProps) => (
  <svg {...base(size, className, style)}>
    <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    <path d="M12 9v4" />
    <path d="M12 17h.01" />
  </svg>
);

export const IconCheck = ({ size = 20, className, style }: IconProps) => (
  <svg {...base(size, className, style)}>
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <path d="m9 11 3 3L22 4" />
  </svg>
);

export const IconInfo = ({ size = 20, className, style }: IconProps) => (
  <svg {...base(size, className, style)}>
    <circle cx="12" cy="12" r="10" />
    <path d="M12 16v-4" />
    <path d="M12 8h.01" />
  </svg>
);

export const IconDownload = ({ size = 20, className, style }: IconProps) => (
  <svg {...base(size, className, style)}>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <path d="M7 10l5 5 5-5" />
    <path d="M12 15V3" />
  </svg>
);

export const IconPrint = ({ size = 20, className, style }: IconProps) => (
  <svg {...base(size, className, style)}>
    <path d="M6 9V2h12v7" />
    <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
    <rect x="6" y="14" width="12" height="8" rx="1" />
  </svg>
);

export const IconBuilding = ({ size = 20, className, style }: IconProps) => (
  <svg {...base(size, className, style)}>
    <rect x="4" y="2" width="16" height="20" rx="1.5" />
    <path d="M9 22v-4h6v4" />
    <path d="M8 6h.01M12 6h.01M16 6h.01M8 10h.01M12 10h.01M16 10h.01M8 14h.01M12 14h.01M16 14h.01" />
  </svg>
);

export const IconTrending = ({ size = 20, className, style }: IconProps) => (
  <svg {...base(size, className, style)}>
    <path d="M23 6l-9.5 9.5-5-5L1 18" />
    <path d="M17 6h6v6" />
  </svg>
);

export const IconSparkles = ({ size = 20, className, style }: IconProps) => (
  <svg {...base(size, className, style)}>
    <path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z" />
    <path d="M19 15l.9 2.4L22 18l-2.1.6L19 21l-.9-2.4L16 18l2.1-.6z" />
    <path d="M5 2l.7 1.8L7.5 4.5l-1.8.7L5 7l-.7-1.8L2.5 4.5l1.8-.7z" />
  </svg>
);

export const IconFolder = ({ size = 20, className, style }: IconProps) => (
  <svg {...base(size, className, style)}>
    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
    <path d="M12 11v6" />
    <path d="M9 14h6" />
  </svg>
);

export const IconUsers = ({ size = 20, className, style }: IconProps) => (
  <svg {...base(size, className, style)}>
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

export const IconHeart = ({ size = 20, className, style }: IconProps) => (
  <svg {...base(size, className, style)}>
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
  </svg>
);

export const IconShare = ({ size = 20, className, style }: IconProps) => (
  <svg {...base(size, className, style)}>
    <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
    <path d="m16 6-4-4-4 4" />
    <path d="M12 2v13" />
  </svg>
);

export const IconCard = ({ size = 20, className, style }: IconProps) => (
  <svg {...base(size, className, style)}>
    <rect x="2" y="5" width="20" height="14" rx="2" />
    <path d="M2 10h20" />
    <path d="M6 15h4" />
  </svg>
);

export const IconLock = ({ size = 20, className, style }: IconProps) => (
  <svg {...base(size, className, style)}>
    <rect x="4" y="11" width="16" height="10" rx="2" />
    <path d="M8 11V7a4 4 0 0 1 8 0v4" />
  </svg>
);

export const IconGlobe = ({ size = 20, className, style }: IconProps) => (
  <svg {...base(size, className, style)}>
    <circle cx="12" cy="12" r="10" />
    <path d="M2 12h20" />
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
  </svg>
);
