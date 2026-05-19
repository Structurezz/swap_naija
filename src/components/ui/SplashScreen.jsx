import { useEffect, useState } from 'react';

export default function SplashScreen({ ready }) {
  const [fadeOut, setFadeOut] = useState(false);
  const [gone,    setGone]    = useState(false);

  useEffect(() => {
    if (!ready) return;
    const t = setTimeout(() => setFadeOut(true), 2800);
    return () => clearTimeout(t);
  }, [ready]);

  useEffect(() => {
    if (!fadeOut) return;
    const t = setTimeout(() => setGone(true), 600);
    return () => clearTimeout(t);
  }, [fadeOut]);

  if (gone) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-white"
      style={{
        transition: 'opacity 0.6s ease',
        opacity: fadeOut ? 0 : 1,
        pointerEvents: fadeOut ? 'none' : 'auto',
      }}
    >
      <svg
        viewBox="0 0 300 68"
        width="300"
        height="68"
        xmlns="http://www.w3.org/2000/svg"
        overflow="visible"
      >
        {/* ── Green rounded box ── */}
        <g style={{ transformBox: 'fill-box', transformOrigin: 'center', animation: 'boxPop 0.55s cubic-bezier(0.34,1.56,0.64,1) both' }}>
          <rect x="0" y="0" width="68" height="68" rx="15" fill="#62C6A0" />
        </g>

        {/* ── Swap arrows (ArrowRightLeft, 24×24 → scaled to 38×38, centred in 68×68) ── */}
        <g
          transform="translate(15, 15) scale(1.583)"
          stroke="white"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          style={{ animation: 'arrowDraw 0.45s 0.4s ease both' }}
        >
          {/* right arrow */}
          <polyline points="16,3 20,7 16,11" />
          <line x1="4" y1="7" x2="20" y2="7" />
          {/* left arrow */}
          <polyline points="8,21 4,17 8,13" />
          <line x1="4" y1="17" x2="20" y2="17" />
        </g>

        {/* ── "SwapNaija" wordmark ── */}
        <text
          x="84"
          y="48"
          fontFamily="Sora, 'DM Sans', sans-serif"
          fontWeight="700"
          fontSize="38"
          fill="#111827"
          style={{ transformBox: 'fill-box', transformOrigin: 'left center', animation: 'textSlide 0.5s 0.55s ease both' }}
        >
          SwapNaija
        </text>
      </svg>

      <style>{`
        @keyframes boxPop {
          from { transform: scale(0); opacity: 0; }
          to   { transform: scale(1); opacity: 1; }
        }
        @keyframes arrowDraw {
          from { opacity: 0; transform: translate(15px,15px) scale(1.583) scale(0.6); }
          to   { opacity: 1; transform: translate(15px,15px) scale(1.583) scale(1); }
        }
        @keyframes textSlide {
          from { opacity: 0; transform: translateX(18px); }
          to   { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}
