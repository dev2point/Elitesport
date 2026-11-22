interface BrandLogoProps {
  variant?: 'hero' | 'solid';
  size?: 'sm' | 'md';
  showWordmark?: boolean;
}

export function BrandLogo({
  variant = 'solid',
  size = 'md',
  showWordmark = true,
}: BrandLogoProps) {
  const isHero = variant === 'hero';
  const iconDimensions = size === 'sm' ? 'h-7 w-7' : 'h-7 w-7 sm:h-9 sm:w-9';

  return (
    <span className="inline-flex items-center gap-2 sm:gap-2.5 shrink-0">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 128 128"
        aria-hidden="true"
        className={`${iconDimensions} shrink-0`}
      >
        <rect
          x="4"
          y="4"
          width="120"
          height="120"
          rx="28"
          fill={isHero ? '#F8FAF7' : '#123D2B'}
        />
        <g
          fill="none"
          stroke={isHero ? '#123D2B' : '#F8FAF7'}
          strokeWidth="7"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="24" y="24" width="80" height="80" rx="14" />
          <path d="M46 24 V38 H82 V24" />
          <path d="M46 104 V90 H82 V104" />
          <line x1="24" y1="64" x2="46" y2="64" />
          <line x1="82" y1="64" x2="104" y2="64" />
        </g>
        <circle
          cx="64"
          cy="64"
          r="18"
          fill="none"
          stroke="#32CD75"
          strokeWidth="7"
        />
        <circle cx="64" cy="64" r="6.5" fill="#32CD75" />
      </svg>

      {showWordmark && (
        <span
          className={`font-hero text-lg sm:text-xl font-extrabold tracking-[-0.03em] leading-none ${
            isHero ? 'text-white' : 'text-[#123D2B]'
          }`}
        >
          TERRAIN
        </span>
      )}
    </span>
  );
}
