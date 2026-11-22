// Logo do app: coração com linha de batimento e um pedacinho de esparadrapo.
export function Logo({ tamanho = 64 }) {
  return (
    <svg width={tamanho} height={tamanho} viewBox="0 0 512 512" role="img" aria-label="Logo">
      <rect width="512" height="512" rx="116" fill="#1E5A55" />
      <path d="M256 404c-10 0-19-4-27-11C150 324 92 272 92 196c0-55 42-98 95-98 30 0 54 13 69 36 15-23 39-36 69-36 53 0 95 43 95 98 0 76-58 128-137 197-8 7-17 11-27 11Z"
        fill="#F6FAF8" />
      <path d="M118 246h78l24-48 34 104 30-78 18 22h92" fill="none" stroke="#1E5A55" strokeWidth="26"
        strokeLinecap="round" strokeLinejoin="round" />
      <g transform="rotate(-32 382 132)">
        <path d="M322 108l6-6 6 6 6-6 6 6 6-6 6 6 6-6 6 6 6-6 6 6 6-6 6 6 6-6 6 6 6-6 6 6v50l-6 6-6-6-6 6-6-6-6 6-6-6-6 6-6-6-6 6-6-6-6 6-6-6-6 6-6-6-6 6-6-6z"
          fill="#EFE3BF" />
      </g>
    </svg>
  );
}
