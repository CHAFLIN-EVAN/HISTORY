import { useEffect, useRef, useState, useCallback } from 'react';

interface Props {
  snapEnabled?: boolean;
}

export default function CustomCursor({ snapEnabled = true }: Props) {
  const [snapped, setSnapped] = useState(false);
  const [snapRect, setSnapRect] = useState<DOMRect | null>(null);
  const targetRef = useRef({ x: -200, y: -200 });
  const smoothRef = useRef({ x: -200, y: -200 });
  const animRef = useRef<number>(0);
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
    function onMove(e: MouseEvent) {
      const hit = findCardUnderCursor(e.clientX, e.clientY);

      if (hit) {
        targetRef.current = { x: hit.cx, y: hit.cy };
        setSnapped(true);
        setSnapRect(hit.rect);
      } else {
        targetRef.current = { x: e.clientX, y: e.clientY };
        setSnapped(false);
        setSnapRect(null);
      }
    }

    window.addEventListener('mousemove', onMove, { passive: true });
    return () => window.removeEventListener('mousemove', onMove);
  }, [findCardUnderCursor]);

  // Smooth follow using rAF — reliable, no React re-render, no GSAP-left/top issues
  useEffect(() => {
    const lineEl = lineRef.current;
    const glowEl = glowRef.current;
    const dotEl = dotRef.current;

    function animate() {
      const s = smoothRef.current;
      const t = targetRef.current;
      const easing = 0.12;
      s.x += (t.x - s.x) * easing;
      s.y += (t.y - s.y) * easing;

      if (lineEl) {
        lineEl.style.left = s.x + 'px';
        lineEl.style.top = s.y + 'px';
      }
      if (glowEl) {
        glowEl.style.left = s.x + 'px';
        glowEl.style.top = s.y + 'px';
      }
      if (dotEl) {
        dotEl.style.left = s.x + 'px';
        dotEl.style.top = s.y + 'px';
      }

      animRef.current = requestAnimationFrame(animate);
    }

    animRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animRef.current);
  }, []);

  const LINE_LENGTH = 9999;

  return (
    <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 9999 }}>
      <div className={`transition-opacity duration-200 ${snapped ? 'opacity-0' : 'opacity-100'}`}>
        {/* Crosshair lines container */}
        <div ref={lineRef} className="absolute" style={{ left: -200, top: -200 }}>
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
          style={{ left: -200, top: -200, background: 'radial-gradient(circle, rgba(255,255,255,0.07) 0%, transparent 70%)' }}
        />

        {/* Center dot */}
        <div
          ref={dotRef}
          className="absolute w-1 h-1 rounded-full bg-white/50 -translate-x-1/2 -translate-y-1/2"
          style={{ left: -200, top: -200 }}
        />
      </div>

      {/* Snap frame — positioned directly from snapRect, no GSAP involved */}
      {snapped && snapRect && (
        <div
          ref={frameRef}
          className="absolute border border-white/40 rounded-lg"
          style={{
            left: snapRect.left + snapRect.width / 2,
            top: snapRect.top + snapRect.height / 2,
            width: snapRect.width + 12,
            height: snapRect.height + 12,
            marginLeft: -(snapRect.width + 12) / 2,
            marginTop: -(snapRect.height + 12) / 2,
            boxShadow: '0 0 30px rgba(255,255,255,0.05), inset 0 0 30px rgba(255,255,255,0.02)',
          }}
        >
          <div className="absolute -top-0.5 left-1 w-3 h-3 border-t border-l border-white/55 rounded-tl-sm" />
          <div className="absolute -top-0.5 right-1 w-3 h-3 border-t border-r border-white/55 rounded-tr-sm" />
          <div className="absolute -bottom-0.5 left-1 w-3 h-3 border-b border-l border-white/55 rounded-bl-sm" />
          <div className="absolute -bottom-0.5 right-1 w-3 h-3 border-b border-r border-white/55 rounded-br-sm" />
        </div>
      )}
    </div>
  );
}
