import { useEffect, useState } from 'react';

/**
 * Full-screen splash shown while the app initialises.
 * Fades out once `ready` is true (auth init complete).
 */
export default function SplashScreen({ ready }) {
  const [fadeOut, setFadeOut] = useState(false);
  const [gone,    setGone]    = useState(false);

  useEffect(() => {
    if (!ready) return;
    // Show for at least 2.8 s so all animations play and users can read it
    const t = setTimeout(() => setFadeOut(true), 2800);
    return () => clearTimeout(t);
  }, [ready]);

  useEffect(() => {
    if (!fadeOut) return;
    // Remove from DOM after the fade-out transition ends (600 ms)
    const t = setTimeout(() => setGone(true), 600);
    return () => clearTimeout(t);
  }, [fadeOut]);

  if (gone) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-primary"
      style={{
        transition: 'opacity 0.6s ease',
        opacity: fadeOut ? 0 : 1,
        pointerEvents: fadeOut ? 'none' : 'auto',
      }}
    >
      {/* ── Logo ── */}
      <div
        style={{ animation: 'splashLogoIn 0.6s cubic-bezier(0.34,1.56,0.64,1) both' }}
      >
        <div className="bg-white rounded-3xl px-8 py-5 shadow-2xl">
          <img src="/swapnaija-logo.png" alt="SwapNaija" className="h-12 w-auto block" />
        </div>
      </div>

      {/* ── Slogan ── */}
      <p
        className="mt-4 text-white/80 text-base font-medium tracking-wide"
        style={{ animation: 'splashFadeUp 0.5s 0.5s ease both' }}
      >
        Modernizing trade by barter
      </p>

      {/* ── Loading bar ── */}
      <div
        className="mt-10 w-40 h-1 rounded-full bg-white/20 overflow-hidden"
        style={{ animation: 'splashFadeUp 0.5s 0.6s ease both' }}
      >
        <div
          className="h-full rounded-full bg-white"
          style={{ animation: 'splashBar 2.4s 0.7s ease-in-out both' }}
        />
      </div>

      {/* ── Footer ── */}
      <div
        className="absolute bottom-10 flex flex-col items-center gap-1"
        style={{ animation: 'splashFadeUp 0.5s 0.8s ease both' }}
      >
        <p className="text-white/40 text-xs uppercase tracking-widest font-medium">Powered by</p>
        <p className="text-white/70 text-sm font-display font-semibold tracking-wide">
          Structurezz Technologies
        </p>
      </div>

      {/* Keyframe definitions injected inline so they work without a global CSS file change */}
      <style>{`
        @keyframes splashLogoIn {
          from { opacity: 0; transform: scale(0.7) translateY(16px); }
          to   { opacity: 1; transform: scale(1)   translateY(0);    }
        }
        @keyframes splashFadeUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0);    }
        }
        @keyframes splashBar {
          from { width: 0%;   }
          to   { width: 100%; }
        }
      `}</style>
    </div>
  );
}
