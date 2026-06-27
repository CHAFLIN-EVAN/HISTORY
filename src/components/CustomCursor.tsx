import { useEffect, useRef, useState } from 'react';

interface Props {
  snapEnabled?: boolean;
}

export default function CustomCursor({ snapEnabled = true }: Props) {
  const [snapped, setSnapped] = useState(false);
  const [snapRect, setSnapRect] = useState<DOMRect | null>(null);

  const cursorRef = useRef<HTMLDivElement>(null);
  const snapRef = useRef<HTMLDivElement>(null);
  const targetRef = useRef({ x: -999, y: -999 });
  const smoothRef = useRef({ x: -999, y: -999 });
  const snappedRef = useRef(false);
  const lastSnapElRef = useRef<Element | null>(null);

  useEffect(() => {
    const cursorEl = cursorRef.current;

    function onMove(e: MouseEvent) {
      let tx = e.clientX;
      let ty = e.clientY;
      let hitEl: Element | null = null;
      let hitRect: DOMRect | null = null;

      if (snapEnabled) {
        const cards = document.querySelectorAll('[data-snap]');
        for (const card of cards) {
          const r = card.getBoundingClientRect();
          if (e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom) {
            tx = r.left + r.width / 2;
            ty = r.top + r.height / 2;
            hitEl = card;
            hitRect = r;
            break;
          }
        }
      }

      targetRef.current = { x: tx, y: ty };

      if (hitEl && hitRect) {
        const prevEl = lastSnapElRef.current;
        lastSnapElRef.current = hitEl;
        if (prevEl !== hitEl) {
          setSnapRect(hitRect);
          if (!snappedRef.current) {
            snappedRef.current = true;
            setSnapped(true);
          }
        }
        // Direct DOM update for smooth snap-frame following
        const snapEl = snapRef.current;
        if (snapEl) {
          const w = hitRect.width + 12;
          const h = hitRect.height + 12;
          snapEl.style.transform = `translate(${tx - w / 2}px, ${ty - h / 2}px)`;
        }
      } else if (snappedRef.current) {
        lastSnapElRef.current = null;
        snappedRef.current = false;
        setSnapped(false);
        setSnapRect(null);
      }
    }

    window.addEventListener('mousemove', onMove, { passive: true });

    let id: number;
    function loop() {
      const s = smoothRef.current;
      const t = targetRef.current;
      const ease = 0.14;
      s.x += (t.x - s.x) * ease;
      s.y += (t.y - s.y) * ease;

      if (cursorEl) {
        cursorEl.style.transform = `translate(${s.x}px, ${s.y}px)`;
      }

      id = requestAnimationFrame(loop);
    }
    id = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener('mousemove', onMove);
      cancelAnimationFrame(id);
    };
  }, [snapEnabled]);

  const LINE = 9999;

  return (
    <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 9999 }}>
      {/* Crosshair layer — hidden when snapped */}
      <div ref={cursorRef} className="absolute" style={{ left: 0, top: 0 }}>
        <div className={`transition-opacity duration-150 ${snapped ? 'opacity-0' : 'opacity-100'}`}>
          {/* Vertical line */}
          <div className="absolute w-[0.5px] bg-white/25" style={{ left: -0.25, top: -LINE, height: LINE * 2 }} />
          {/* Horizontal line */}
          <div className="absolute h-[0.5px] bg-white/25" style={{ top: -0.25, left: -LINE, width: LINE * 2 }} />
          {/* Glow */}
          <div
            className="absolute w-14 h-14 rounded-full -translate-x-1/2 -translate-y-1/2"
            style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.07) 0%, transparent 70%)' }}
          />
          {/* Center dot */}
          <div className="absolute w-1 h-1 rounded-full bg-white/50 -translate-x-1/2 -translate-y-1/2" />
        </div>
      </div>

      {/* Snap frame — positioned via snapRect for immediate correct placement */}
      {snapped && snapRect && (
        <div
          ref={snapRef}
          className="absolute"
          style={{
            left: 0,
            top: 0,
            transform: `translate(${snapRect.left - 6}px, ${snapRect.top - 6}px)`,
          }}
        >
          <div
            className="border border-white/40 rounded-lg relative"
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
