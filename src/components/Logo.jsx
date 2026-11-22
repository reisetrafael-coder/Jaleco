// Logo do app: coração com linha de batimento e um pedacinho de esparadrapo.
// animado = a linha do batimento se desenha e o coração pulsa (usado na abertura).
export function Logo({ tamanho = 64, animado = false }) {
  return (
    <svg width={tamanho} height={tamanho} viewBox="0 0 512 512" role="img" aria-label="Logo"
      className={`logo ${animado ? 'logo-animado' : ''}`}>
      <defs>
        <linearGradient id="logo-fundo" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#BCA3F7" />
          <stop offset="1" stopColor="#9577EA" />
        </linearGradient>
        <clipPath id="logo-dentro"><path d="M256 404c-10 0-19-4-27-11C150 324 92 272 92 196c0-55 42-98 95-98 30 0 54 13 69 36 15-23 39-36 69-36 53 0 95 43 95 98 0 76-58 128-137 197-8 7-17 11-27 11Z" /></clipPath>
      </defs>
      <rect width="512" height="512" rx="116" fill="url(#logo-fundo)" />
      <g className="logo-coracao">
        <path d="M256 404c-10 0-19-4-27-11C150 324 92 272 92 196c0-55 42-98 95-98 30 0 54 13 69 36 15-23 39-36 69-36 53 0 95 43 95 98 0 76-58 128-137 197-8 7-17 11-27 11Z"
          fill="#FFFFFF" />
        <path className="logo-ecg" clipPath="url(#logo-dentro)" d="M80 246h116l24-48 34 104 30-78 18 22h92" fill="none" stroke="#7A52E0" strokeWidth="26"
          strokeLinecap="round" strokeLinejoin="round" pathLength="1" />
      </g>
      <g className="logo-fita"><g transform="rotate(-32 382 132)">
        <path d="M322 108l6-6 6 6 6-6 6 6 6-6 6 6 6-6 6 6 6-6 6 6 6-6 6 6 6-6 6 6 6-6 6 6v50l-6 6-6-6-6 6-6-6-6 6-6-6-6 6-6-6-6 6-6-6-6 6-6-6-6 6-6-6-6 6-6-6z"
          fill="#EFE3BF" />
      </g></g>
    </svg>
  );
}
