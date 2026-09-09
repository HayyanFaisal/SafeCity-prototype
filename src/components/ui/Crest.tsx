export default function Crest({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" aria-label="PNS SafeCity crest">
      <defs>
        <linearGradient id="crestGold" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#E4C35A" />
          <stop offset="1" stopColor="#B8901F" />
        </linearGradient>
      </defs>
      {/* shield */}
      <path
        d="M32 3l24 8v18c0 15-10 26-24 32C18 55 8 44 8 29V11l24-8z"
        fill="#0B182B"
        stroke="url(#crestGold)"
        strokeWidth="2.5"
      />
      {/* anchor */}
      <g stroke="url(#crestGold)" strokeWidth="2.4" strokeLinecap="round" fill="none">
        <circle cx="32" cy="17" r="3.2" />
        <line x1="32" y1="20" x2="32" y2="45" />
        <line x1="24" y1="27" x2="40" y2="27" />
        <path d="M18 38c2 7 8 10 14 10s12-3 14-10" />
        <path d="M18 38l-3 3M46 38l3 3" />
      </g>
      {/* crescent + star */}
      <path d="M50 12a6 6 0 10-2 10 5 5 0 012-10z" fill="url(#crestGold)" opacity="0.9" />
    </svg>
  )
}
