export function LogoIcon({ size = 36, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 transition-transform ${className}`}
    >
      <defs>
        <linearGradient id="logo-bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#304cff" />
          <stop offset="100%" stopColor="#4f46e5" />
        </linearGradient>
        <linearGradient id="logo-cursor" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#dcef98" />
          <stop offset="100%" stopColor="#93c5fd" />
        </linearGradient>
      </defs>

      {/* Contenedor ventana redondeada */}
      <rect x="4" y="4" width="56" height="56" rx="14" fill="url(#logo-bg)" />

      {/* Puntos de ventana de terminal */}
      <circle cx="16" cy="16" r="2.5" fill="#ffffff" fillOpacity="0.4" />
      <circle cx="23" cy="16" r="2.5" fill="#ffffff" fillOpacity="0.4" />
      <circle cx="30" cy="16" r="2.5" fill="#ffffff" fillOpacity="0.4" />

      {/* Línea sutil divisoria */}
      <line x1="4" y1="23" x2="60" y2="23" stroke="#ffffff" strokeOpacity="0.15" strokeWidth="1.5" />

      {/* Prompt de consola: Chevron > */}
      <path
        d="M16 31L27 40L16 49"
        stroke="#ffffff"
        strokeWidth="4.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Cursor terminal _ */}
      <line
        x1="33"
        y1="48"
        x2="48"
        y2="48"
        stroke="url(#logo-cursor)"
        strokeWidth="5"
        strokeLinecap="round"
      />
    </svg>
  );
}
