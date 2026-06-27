import { useEffect, useRef, useState, useCallback } from 'react';
import gsap from 'gsap';

interface Props {
  snapEnabled?: boolean;
}

export default function CustomCursor({ snapEnabled = true }: Props) {
  const [snapped, setSnapped] = useState(false);
  const [snapRect, setSnapRect] = useState<DOMRect | null>(null);
  const xTo = useRef<gsap.QuickToFunc | null>(null);
  const yTo = useRef<gsap.QuickToFunc | null>(null);
  const xToFrame = useRef<gsap.QuickToFunc | null>(null);
  const yToFrame = useRef<gsap.QuickToFunc | null>(null);
  // Wrapper refs — these are positioned by GSAP via left/top, inner elements handle centering via CSS
  const lineWrapRef = useRef<HTMLDivElement>(null);
  const glowWrapRef = useRef<HTMLDivElement>(null);
  const dotWrapRef = useRef<HTMLDivElement>(null);
  const frameWrapRef = useRef<HTMLDivElement>(null);

  const findCardUnderCursor = useCallback((mx: number, my: number) => {
    if (!snapEnabled) return null;
    const cards = document.querySelectorAll('[data-snap]');
    for (const el of cards) {
      const rect = el.getBoundingClientRect();
      if (mx >= rect.left && mx <= rect.right && my >= rect.top && my <= rect.bottom) {
        return { cx: rect.left + rect.width / 2, cy: rect.top + rect.height / 2, rect };
      }
    }
    return null;
  }, [snapEnabled]);

  useEffect(() => {
    const lineEl = lineWrapRef.current!;
    const glowEl = glowWrapRef.current!;
    const dotEl = dotWrapRef.current!;

    // Initial position offscreen — GSAP owns left/top, React does NOT set them in JSX
    gsap.set([lineEl, glowEl, dotEl], { left: -200, top: -200 });

    xTo.current = gsap.quickTo([lineEl, glowEl, dotEl], 'left', { duration: 0.15, ease: 'power2.out' });
    yTo.current = gsap.quickTo([lineEl, glowEl, dotEl], 'top', { duration: 0.15, ease: 'power2.out' });
  }, []);

  useEffect(() => {
    function onMove(e: MouseEvent) {
      const hit = findCardUnderCursor(e.clientX, e.clientY);

      if (hit) {
        xTo.current?.(hit.cx);
        yTo.current?.(hit.cy);
        setSnapped(true);
        setSnapRect(hit.rect);

        if (frameWrapRef.current) {
          if (!xToFrame.current) {
            xToFrame.current = gsap.quickTo(frameWrapRef.current, 'left', { duration: 0.1, ease: 'power3.out' });
            yToFrame.current = gsap.quickTo(frameWrapRef.current, 'top', { duration: 0.1, ease: 'power3.out' });
          }
          const xf = xToFrame.current;
          const yf = yToFrame.current;
          if (xf && yf) {
            xf(hit.cx);
            yf(hit.cy);
          }
        }
      } else {
        xTo.current?.(e.clientX);
        yTo.current?.(e.clientY);
        setSnapped(false);
        setSnapRect(null);
      }
    }

    window.addEventListener('mousemove', onMove, { passive: true });
    return () => window.removeEventListener('mousemove', onMove);
  }, [findCardUnderCursor]);

  const LINE_LENGTH = 9999;

  return (
    <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 9999 }}>
      <div className={`transition-opacity duration-200 ${snapped ? 'opacity-0' : 'opacity-100'}`}>
        {/* Crosshair lines — wrapper positioned by GSAP, inner lines extend from (0,0) */}
        <div ref={lineWrapRef} className="absolute">
          <div
            className="absolute w-[0.5px] bg-white/25 -translate-x-1/2"
            style={{ top: -LINE_LENGTH, height: LINE_LENGTH * 2 }}
          />
          <div
            className="absolute h-[0.5px] bg-white/25 -translate-y-1/2"
            style={{ left: -LINE_LENGTH, width: LINE_LENGTH * 2 }}
          />
        </div>

        {/* Glow — wrapper positioned by GSAP, inner div centered via translate */}
        <div ref={glowWrapRef} className="absolute">
          <div
            className="w-14 h-14 rounded-full -translate-x-1/2 -translate-y-1/2"
            style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.07) 0%, transparent 70%)' }}
          />
        </div>

        {/* Center dot — wrapper positioned by GSAP */}
        <div ref={dotWrapRef} className="absolute">
          <div className="w-1 h-1 rounded-full bg-white/50 -translate-x-1/2 -translate-y-1/2" />
        </div>
      </div>

      {/* Snap frame — wrapper positioned by GSAP, inner centered via translate */}
      {snapped && snapRect && (
        <div ref={frameWrapRef} className="absolute">
          <div
            className="border border-white/40 rounded-lg -translate-x-1/2 -translate-y-1/2 relative"
            style={{
              width: snapRect.width + 12,
              height: snapRect.height + 12,
              boxShadow: '0 0 30px rgba(255,255,255,0.05), inset 0 0 30px rgba(255,255,255,0.02)',
            }}
          >
            <div className="absolute -top-0.5 left-1 w-3 h-3 border-t border-l border-white/55 rounded-tl-sm" />
            <div className="absolute -top-0.5 right-1 w-3 h-3 border-t border-r border-white/55 rounded-tr-sm" />
            <div className="absolute -bottom-0.5 left-1 w-3 h-3 border-b border-l border-white/55 rounded-bl-sm" />
            <div className="absolute -bottom-0.5 right-1 w-3 h-3 border-b border-r border-white/55 rounded-br-sm" />
          </div>
        </div>
      )}
    </div>
  );
}
