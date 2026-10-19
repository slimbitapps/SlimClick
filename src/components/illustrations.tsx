/** Kleine Bilder für die Einführung (passen sich hell/dunkel an) */
const S = { fill: 'none', stroke: 'currentColor', strokeWidth: 2.2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };

export function IllScan() {
  return (
    <svg viewBox="0 0 160 100" width="160" height="100" aria-hidden="true">
      <rect x="22" y="14" width="64" height="44" rx="5" fill="var(--surface-2)" stroke="var(--line-3)" strokeWidth="1.5" />
      <path d="M14 62h80" stroke="var(--line-3)" strokeWidth="3" strokeLinecap="round" />
      {[0, 1, 2, 3, 4].map((r) =>
        [0, 1, 2, 3, 4].map((c) => ((r * 5 + c) * 7) % 3 !== 0 && <rect key={`${r}${c}`} x={41 + c * 5.4} y={21 + r * 5.4} width="4.4" height="4.4" rx="0.8" fill="var(--text)" />),
      )}
      <g transform="translate(100 22) rotate(8)">
        <rect width="34" height="62" rx="7" fill="var(--surface)" stroke="var(--accent)" strokeWidth="2.2" />
        <circle cx="17" cy="27" r="9" {...S} stroke="var(--accent)" />
        <circle cx="17" cy="27" r="3" fill="var(--accent)" />
      </g>
      <path d="M90 40c4-6 8-8 12-8" {...S} stroke="var(--accent)" strokeDasharray="3 4" />
    </svg>
  );
}

export function IllPresent() {
  return (
    <svg viewBox="0 0 160 100" width="160" height="100" aria-hidden="true">
      <rect x="18" y="12" width="124" height="70" rx="6" fill="var(--surface-2)" stroke="var(--line-3)" strokeWidth="1.5" />
      <rect x="30" y="26" width="58" height="8" rx="3" fill="var(--text)" opacity="0.8" />
      <rect x="30" y="42" width="84" height="5" rx="2.5" fill="var(--text-3)" />
      <rect x="30" y="53" width="70" height="5" rx="2.5" fill="var(--text-3)" />
      <circle cx="118" cy="62" r="5" fill="#ff3b30" />
      <circle cx="118" cy="62" r="10" fill="#ff3b30" opacity="0.2" />
      <path d="M70 82v8M58 92h24" stroke="var(--line-3)" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

export function IllTap() {
  return (
    <svg viewBox="0 0 160 100" width="160" height="100" aria-hidden="true">
      <rect x="56" y="6" width="48" height="88" rx="9" fill="var(--surface)" stroke="var(--line-3)" strokeWidth="1.5" />
      <rect x="62" y="16" width="36" height="22" rx="3" fill="var(--surface-3)" />
      <rect x="62" y="62" width="12" height="24" rx="4" fill="var(--surface-3)" />
      <rect x="77" y="62" width="21" height="24" rx="4" fill="var(--accent)" />
      <path d="M85 71l4 3-4 3" {...S} stroke="#fff" strokeWidth="2" />
      <circle cx="88" cy="74" r="15" fill="none" stroke="var(--accent)" strokeWidth="1.5" opacity="0.4" />
      <path d="M118 30c6 4 8 10 6 18M126 22c10 8 12 20 8 32" {...S} stroke="var(--accent)" opacity="0.6" />
    </svg>
  );
}
