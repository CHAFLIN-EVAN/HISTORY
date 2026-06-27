import { useEffect, useRef, useState, useCallback } from 'react';

interface Props {
  snapEnabled?: boolean;
}

export default function CustomCursor({ snapEnabled = true }: Props) {
  const [pos, setPos] = useState({ x: -200, y: -200 });
  const [snapped, setSnapped] = useState(false);
  const [snapRect, setSnapRect] = useState<DOMRect | null>(null);
  const targetRef = useRef({ x: -200, y: -200 });
  const smoothRef = useRef({ x: -200, y: -200 });
  const animRef = useRef<number>(0);

  const findCardUnderCursor = useCallback((mx: number, my: number) => {
    if (!snapEnabled) return null;
    const cards = document.querySelectorAll('[data-snap]');
    for (const el of cards) {
      const rect = el.getBoundingClientRect();
      if (mx >= rect.left && mx <= rect.right && my >= rect.top && my <= rect.bottom) {
        return {
          cx: rect.left + rect.width / 2,
          cy: rect.top + rect.height / 2,
          rect,
        };
      }
    }
    return null;
  }, [snapEnabled]);

  useEffect(() => {
    function onMove(e: MouseEvent) {
      targetRef.current = { x: e.clientX, y: e.clientY };

      const hit = findCardUnderCursor(e.clientX, e.clientY);
      if (hit) {
        targetRef.current = { x: hit.cx, y: hit.cy };
        setSnapped(true);
        setSnapRect(hit.rect);
      } else {
        setSnapped(false);
        setSnapRect(null);
      }
    }

    window.addEventListener('mousemove', onMove, { passive: true });
    return () => window.removeEventListener('mousemove', onMove);
  }, [findCardUnderCursor]);

  // Smooth animation loop
  useEffect(() => {
    function animate() {
      const s = smoothRef.current;
      const t = targetRef.current;
      const easing = snapped ? 0.4 : 0.12;
      s.x += (t.x - s.x) * easing;
      s.y += (t.y - s.y) * easing;
      setPos({ x: s.x, y: s.y });
      animRef.current = requestAnimationFrame(animate);
    }
    animRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animRef.current);
  }, [snapped]);

  // Lines extend way beyond viewport to ensure they always reach edges
  const LINE_LENGTH = 9999;

  return (
    <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 9999 }}>
      {/* Crosshair lines — positioned directly, not inside a transformed container */}
      <div className={`transition-opacity duration-200 ${snapped ? 'opacity-0' : 'opacity-100'}`}>
        {/* Vertical line */}
        <div
          className="absolute w-[0.5px] bg-white/25"
          style={{
            left: pos.x,
            top: pos.y - LINE_LENGTH,
            height: LINE_LENGTH * 2,
          }}
        />
        {/* Horizontal line */}
        <div
          className="absolute h-[0.5px] bg-white/25"
          style={{
            top: pos.y,
            left: pos.x - LINE_LENGTH,
            width: LINE_LENGTH * 2,
          }}
        />
        {/* Intersection glow */}
        <div
          className="absolute w-14 h-14 rounded-full -translate-x-1/2 -translate-y-1/2"
          style={{
            left: pos.x,
            top: pos.y,
            background: 'radial-gradient(circle, rgba(255,255,255,0.07) 0%, transparent 70%)',
          }}
        />
        {/* Center dot */}
        <div
          className="absolute w-1 h-1 rounded-full bg-white/50 -translate-x-1/2 -translate-y-1/2"
          style={{ left: pos.x, top: pos.y }}
        />
      </div>

      {/* Snap frame */}
      {snapped && snapRect && (
        <div
          className="absolute border border-white/40 rounded-lg transition-opacity duration-150"
          style={{
            left: snapRect.left + snapRect.width / 2,
            top: snapRect.top + snapRect.height / 2,
            width: snapRect.width + 12,
            height: snapRect.height + 12,
            transform: 'translate(-50%, -50%)',
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
