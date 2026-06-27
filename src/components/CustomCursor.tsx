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
  const lineRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const dotRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);

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
    const lineEl = lineRef.current!;
    const glowEl = glowRef.current!;
    const dotEl = dotRef.current!;

    xTo.current = gsap.quickTo([lineEl, glowEl, dotEl], 'x', { duration: 0.15, ease: 'power2.out' });
    yTo.current = gsap.quickTo([lineEl, glowEl, dotEl], 'y', { duration: 0.15, ease: 'power2.out' });
  }, []);

  useEffect(() => {
    function onMove(e: MouseEvent) {
      const hit = findCardUnderCursor(e.clientX, e.clientY);

      if (hit) {
        xTo.current?.(hit.cx);
        yTo.current?.(hit.cy);
        setSnapped(true);
        setSnapRect(hit.rect);

        if (frameRef.current) {
          if (!xToFrame.current) {
            xToFrame.current = gsap.quickTo(frameRef.current, 'x', { duration: 0.12, ease: 'power3.out' });
            yToFrame.current = gsap.quickTo(frameRef.current, 'y', { duration: 0.12, ease: 'power3.out' });
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

    // Set initial position offscreen
    gsap.set([lineRef.current, glowRef.current, dotRef.current], { x: -200, y: -200 });

    window.addEventListener('mousemove', onMove, { passive: true });
    return () => window.removeEventListener('mousemove', onMove);
  }, [findCardUnderCursor]);

  const LINE_LENGTH = 9999;

  return (
    <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 9999 }}>
      <div className={`transition-opacity duration-200 ${snapped ? 'opacity-0' : 'opacity-100'}`}>
        {/* Crosshair lines container */}
        <div ref={lineRef} className="absolute" style={{ left: 0, top: 0 }}>
          <div
            className="absolute w-[0.5px] bg-white/25 -translate-x-1/2"
            style={{ top: -LINE_LENGTH, height: LINE_LENGTH * 2 }}
          />
          <div
            className="absolute h-[0.5px] bg-white/25 -translate-y-1/2"
            style={{ left: -LINE_LENGTH, width: LINE_LENGTH * 2 }}
          />
        </div>

        {/* Glow */}
        <div
          ref={glowRef}
          className="absolute w-14 h-14 rounded-full -translate-x-1/2 -translate-y-1/2"
          style={{ left: 0, top: 0, background: 'radial-gradient(circle, rgba(255,255,255,0.07) 0%, transparent 70%)' }}
        />

        {/* Center dot */}
        <div
          ref={dotRef}
          className="absolute w-1 h-1 rounded-full bg-white/50 -translate-x-1/2 -translate-y-1/2"
          style={{ left: 0, top: 0 }}
        />
      </div>

      {/* Snap frame */}
      {snapped && snapRect && (
        <div
          ref={frameRef}
          className="absolute border border-white/40 rounded-lg"
          style={{
            left: 0,
            top: 0,
            width: snapRect.width + 12,
            height: snapRect.height + 12,
            marginLeft: -(snapRect.width + 12) / 2,
            marginTop: -(snapRect.height + 12) / 2,
            boxShadow: '0 0 30px rgba(255,255,255,0.05), inset 0 0 30px rgba(255,255,255,0.02)',
          }}
        >
          <div className="absolute -top-0.5 -left-0.5 w-3 h-3 border-t border-l border-white/55 rounded-tl-sm" />
          <div className="absolute -top-0.5 -right-0.5 w-3 h-3 border-t border-r border-white/55 rounded-tr-sm" />
          <div className="absolute -bottom-0.5 -left-0.5 w-3 h-3 border-b border-l border-white/55 rounded-bl-sm" />
          <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 border-b border-r border-white/55 rounded-br-sm" />
        </div>
      )}
    </div>
  );
}
