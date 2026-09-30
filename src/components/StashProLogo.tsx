import React from 'react';

export interface StashProLogoProps {
  className?: string;
  variant?: 'badge' | 'full' | 'banner';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showSubtitle?: boolean;
}

export const StashProLogo: React.FC<StashProLogoProps> = ({
  className = '',
  variant = 'badge',
  size = 'md',
  showSubtitle = false,
}) => {
  // Size mapping for badge icon
  const badgeSizes = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-14 h-14',
    xl: 'w-20 h-20',
  };

  // Size mapping for full/banner logos
  const fullSizes = {
    sm: 'h-8',
    md: 'h-10',
    lg: 'h-13',
    xl: 'h-18',
  };

  // 1. Standalone Badge Icon
  if (variant === 'badge') {
    return (
      <div
        className={`relative shrink-0 flex items-center justify-center rounded-2xl overflow-hidden shadow-xs ${badgeSizes[size]} ${className}`}
      >
        <svg
          viewBox="0 0 72 72"
          className="w-full h-full"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <clipPath id="stashBadgeClip">
              <rect x="0" y="0" width="72" height="72" rx="16" />
            </clipPath>
            {/* Amber Golden Ribbon Gradient */}
            <linearGradient id="goldRibbonGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#e59828" />
              <stop offset="50%" stopColor="#d98220" />
              <stop offset="100%" stopColor="#b86812" />
            </linearGradient>
            {/* Deep Forest Green Body Gradient */}
            <linearGradient id="darkGreenGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#043320" />
              <stop offset="60%" stopColor="#022415" />
              <stop offset="100%" stopColor="#01180e" />
            </linearGradient>
          </defs>

          {/* Masked Content */}
          <g clipPath="url(#stashBadgeClip)">
            {/* Dark Green Background */}
            <rect x="0" y="0" width="72" height="72" fill="url(#darkGreenGrad)" />

            {/* Left Amber Ribbon with BRV text */}
            <rect x="0" y="0" width="20" height="72" fill="url(#goldRibbonGrad)" />
            {/* Vertical BRV branding */}
            <text
              transform="translate(10, 36) rotate(-90)"
              textAnchor="middle"
              dominantBaseline="central"
              fill="#181002"
              fontFamily="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
              fontWeight="900"
              fontSize="11"
              letterSpacing="2.5px"
            >
              BRV
            </text>

            {/* Right Side Brand Typography */}
            {/* stāsh in Bold White */}
            <text
              x="46"
              y="37"
              textAnchor="middle"
              dominantBaseline="central"
              fill="#ffffff"
              fontFamily="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
              fontWeight="900"
              fontSize="17.5"
              letterSpacing="-0.6px"
            >
              stāsh
            </text>
            {/* Crisp Macron bar over 'a' */}
            <rect x="41.5" y="24" width="8" height="2.2" rx="1" fill="#ffffff" />

            {/* DISTRIBUTOR in Mint Green */}
            <text
              x="46"
              y="52"
              textAnchor="middle"
              dominantBaseline="central"
              fill="#4ade80"
              fontFamily="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
              fontWeight="900"
              fontSize="6.8"
              letterSpacing="0.8px"
            >
              DISTRIBUTOR
            </text>
          </g>

          {/* Outer Emerald Border */}
          <rect
            x="1"
            y="1"
            width="70"
            height="70"
            rx="15"
            fill="none"
            stroke="#10b981"
            strokeWidth="2.2"
          />
        </svg>
      </div>
    );
  }

  // 2. Full Horizontal Logo (Badge + Wordmark) or Banner (with dark forest container)
  const isBanner = variant === 'banner';

  return (
    <div
      className={`inline-flex items-center gap-3 shrink-0 ${
        isBanner
          ? 'bg-[#011b10] p-2 sm:p-2.5 rounded-2xl border border-emerald-900/60 shadow-lg'
          : ''
      } ${className}`}
    >
      <svg
        viewBox="0 0 252 74"
        className={`${fullSizes[size]} w-auto max-w-full`}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <clipPath id="fullBadgeClip">
            <rect x="1" y="1" width="72" height="72" rx="16" />
          </clipPath>
          <linearGradient id="fullGoldRibbonGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#e59828" />
            <stop offset="50%" stopColor="#d98220" />
            <stop offset="100%" stopColor="#b86812" />
          </linearGradient>
          <linearGradient id="fullDarkGreenGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#043320" />
            <stop offset="60%" stopColor="#022415" />
            <stop offset="100%" stopColor="#01180e" />
          </linearGradient>
        </defs>

        {/* 1. BADGE ICON ON THE LEFT */}
        <g transform="translate(1, 1)">
          <g clipPath="url(#fullBadgeClip)">
            {/* Dark Green Background */}
            <rect x="1" y="1" width="72" height="72" fill="url(#fullDarkGreenGrad)" />

            {/* Left Amber Ribbon */}
            <rect x="1" y="1" width="20" height="72" fill="url(#fullGoldRibbonGrad)" />
            <text
              transform="translate(11, 37) rotate(-90)"
              textAnchor="middle"
              dominantBaseline="central"
              fill="#181002"
              fontFamily="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
              fontWeight="900"
              fontSize="11"
              letterSpacing="2.5px"
            >
              BRV
            </text>

            {/* Right Badge Text */}
            <text
              x="47"
              y="38"
              textAnchor="middle"
              dominantBaseline="central"
              fill="#ffffff"
              fontFamily="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
              fontWeight="900"
              fontSize="17.5"
              letterSpacing="-0.6px"
            >
              stāsh
            </text>
            <rect x="42.5" y="25" width="8" height="2.2" rx="1" fill="#ffffff" />

            <text
              x="47"
              y="53"
              textAnchor="middle"
              dominantBaseline="central"
              fill="#4ade80"
              fontFamily="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
              fontWeight="900"
              fontSize="6.8"
              letterSpacing="0.8px"
            >
              DISTRIBUTOR
            </text>
          </g>

          {/* Border */}
          <rect
            x="2"
            y="2"
            width="70"
            height="70"
            rx="15"
            fill="none"
            stroke="#10b981"
            strokeWidth="2.2"
          />
        </g>

        {/* 2. WORDMARK ON THE RIGHT */}
        {/* 'stāsh' in Mint Green */}
        <text
          x="88"
          y="47"
          fill="#4ade80"
          fontFamily="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
          fontWeight="900"
          fontSize="36"
          letterSpacing="-0.8px"
        >
          stāsh
        </text>
        {/* Macron bar over 'a' */}
        <rect x="129" y="21" width="15" height="3.8" rx="1.8" fill="#4ade80" />

        {/* Amber golden macron bar floating above 'pro' */}
        <rect x="194" y="21" width="16" height="4.2" rx="1.8" fill="#e59828" />

        {/* 'pro' in Golden Amber */}
        <text
          x="192"
          y="59"
          fill="#e59828"
          fontFamily="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
          fontWeight="900"
          fontSize="33"
          letterSpacing="-0.6px"
        >
          pro
        </text>
      </svg>

      {showSubtitle && (
        <span className="hidden sm:inline-block px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
          AREA COVERAGE
        </span>
      )}
    </div>
  );
};
export default StashProLogo;
