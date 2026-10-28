import React from 'react';

interface KemorLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  className?: string;
}

export const KemorLogo: React.FC<KemorLogoProps> = ({
  size = 'md',
  showText = true,
  className = '',
}) => {
  const sizeMap = {
    sm: { icon: 24, font: 'text-sm', badge: 'text-[9px]' },
    md: { icon: 32, font: 'text-lg', badge: 'text-[10px]' },
    lg: { icon: 44, font: 'text-2xl', badge: 'text-xs' },
    xl: { icon: 60, font: 'text-3xl', badge: 'text-sm' },
  };

  const { icon, font, badge } = sizeMap[size];

  return (
    <div className={`flex items-center space-x-2.5 select-none ${className}`}>
      {/* Headphone & Soundwave SVG Icon */}
      <div className="relative flex items-center justify-center flex-shrink-0">
        <svg
          width={icon}
          height={icon}
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="drop-shadow-[0_0_12px_rgba(56,189,248,0.45)] transition-transform duration-300 hover:scale-105"
        >
          <defs>
            <linearGradient id="kemorGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#00f0ff" />
              <stop offset="45%" stopColor="#3b82f6" />
              <stop offset="80%" stopColor="#a855f7" />
              <stop offset="100%" stopColor="#ec4899" />
            </linearGradient>
            <linearGradient id="waveGrad" x1="0%" y1="100%" x2="0%" y2="0%">
              <stop offset="0%" stopColor="#3b82f6" />
              <stop offset="100%" stopColor="#00f0ff" />
            </linearGradient>
            <filter id="neonGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Outer Headphone Headband */}
          <path
            d="M20 54 C20 30, 32 16, 50 16 C68 16, 80 30, 80 54"
            stroke="url(#kemorGrad)"
            strokeWidth="7"
            strokeLinecap="round"
            fill="none"
          />

          {/* Headband Padding Accent */}
          <path
            d="M34 22 C40 19, 45 18, 50 18 C55 18, 60 19, 66 22"
            stroke="#ffffff"
            strokeOpacity="0.4"
            strokeWidth="2.5"
            strokeLinecap="round"
            fill="none"
          />

          {/* Left Earcup */}
          <rect
            x="14"
            y="48"
            width="12"
            height="26"
            rx="6"
            fill="url(#kemorGrad)"
          />
          <rect
            x="16"
            y="52"
            width="4"
            height="18"
            rx="2"
            fill="#ffffff"
            fillOpacity="0.3"
          />

          {/* Right Earcup */}
          <rect
            x="74"
            y="48"
            width="12"
            height="26"
            rx="6"
            fill="url(#kemorGrad)"
          />
          <rect
            x="80"
            y="52"
            width="4"
            height="18"
            rx="2"
            fill="#ffffff"
            fillOpacity="0.3"
          />

          {/* Soundwave Bars in Center */}
          <g fill="url(#waveGrad)">
            {/* Bar 1 */}
            <rect x="36" y="52" width="4" height="18" rx="2" />
            {/* Bar 2 */}
            <rect x="43" y="44" width="4.5" height="34" rx="2.25" />
            {/* Center Peak Bar 3 */}
            <rect x="50" y="38" width="5" height="46" rx="2.5" />
            {/* Bar 4 */}
            <rect x="58" y="46" width="4.5" height="30" rx="2.25" />
            {/* Bar 5 */}
            <rect x="65" y="54" width="4" height="14" rx="2" />
          </g>
        </svg>
      </div>

      {showText && (
        <div className="flex flex-col">
          <div className="flex items-center space-x-1.5">
            <span
              className={`font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-indigo-400 to-fuchsia-400 font-mono ${font}`}
            >
              KEMOR
            </span>
            <span
              className={`bg-indigo-950/80 text-cyan-300 font-semibold px-1.5 py-0.5 rounded-md border border-cyan-500/30 font-mono ${badge}`}
            >
              ESPORTS
            </span>
          </div>
          <span className="text-[9px] tracking-wider text-slate-400 uppercase font-medium -mt-0.5">
            Ultra Audio Mesh
          </span>
        </div>
      )}
    </div>
  );
};
