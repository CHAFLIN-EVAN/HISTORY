import { useEffect, useRef } from 'react';

interface Dot {
  x: number; y: number;
  baseY: number;
  amplitude: number;
  frequency: number;
  phase: number;
  r: number;
}

export default function Starfield() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: -999, y: -999 });

  useEffect(() => {
    function onMove(e: MouseEvent) {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    }
    window.addEventListener('mousemove', onMove, { passive: true });
    return () => window.removeEventListener('mousemove', onMove);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let dots: Dot[] = [];
    let animId: number;
    let time = 0;

    function resize() {
      canvas!.width = window.innerWidth;
      canvas!.height = window.innerHeight;
      initDots();
    }

    function initDots() {
      const spacing = 22; // Denser grid
      const cols = Math.ceil(canvas!.width / spacing) + 2;
      const rows = Math.ceil(canvas!.height / spacing) + 2;
      dots = [];

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          dots.push({
            x: c * spacing,
            y: r * spacing,
            baseY: r * spacing,
            amplitude: 2 + Math.random() * 12,
            frequency: 0.3 + Math.random() * 0.7,
            phase: Math.random() * Math.PI * 2,
            r: 0.5 + Math.random() * 0.8,
          });
        }
      }
    }

    function draw() {
      time += 0.008;
      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;
      ctx!.clearRect(0, 0, canvas!.width, canvas!.height);

      for (const d of dots) {
        // Wave displacement
        const wave1 = Math.sin(d.x * 0.003 + time * 0.4 + d.phase) * d.amplitude;
        const wave2 = Math.cos(d.y * 0.004 + time * 0.6 + d.phase) * d.amplitude * 0.5;
        const wave3 = Math.sin((d.x + d.y) * 0.002 + time * 0.35) * d.amplitude * 0.7;
        const offsetY = wave1 + wave2 + wave3;

        // Mouse repulsion ripple
        const dx = d.x - mx;
        const dy = (d.baseY + offsetY) - my;
        const dist = Math.hypot(dx, dy);
        const mouseRadius = 140;
        let mouseOffsetX = 0;
        let mouseOffsetY = 0;
        let mouseBoost = 0;

        if (dist < mouseRadius) {
          const force = (1 - dist / mouseRadius) ** 2;
          const angle = Math.atan2(dy, dx);
          const pushDist = force * 45;
          mouseOffsetX = Math.cos(angle) * pushDist;
          mouseOffsetY = Math.sin(angle) * pushDist;
          mouseBoost = force * 0.5; // Extra glow near cursor
        }

        const px = d.x + mouseOffsetX;
        const py = d.baseY + offsetY + mouseOffsetY;

        if (py < -20 || py > canvas!.height + 20 || px < -20 || px > canvas!.width + 20) continue;

        const distFromWave = Math.abs(offsetY) / 18;
        let alpha = 0.1 + Math.min(distFromWave, 0.3) + mouseBoost;
        if (alpha > 0.7) alpha = 0.7;

        // Larger glow near cursor
        if (mouseBoost > 0.1) {
          ctx!.beginPath();
          ctx!.arc(px, py, d.r * 6, 0, Math.PI * 2);
          ctx!.fillStyle = `rgba(255,255,255,${alpha * 0.2})`;
          ctx!.fill();
        }

        // Dot
        ctx!.beginPath();
        ctx!.arc(px, py, d.r, 0, Math.PI * 2);
        ctx!.fillStyle = `rgba(255,255,255,${alpha})`;
        ctx!.fill();
      }

      animId = requestAnimationFrame(draw);
    }

    resize();
    window.addEventListener('resize', resize);
    draw();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 0 }}
    />
  );
}
