import { useEffect, useRef } from 'react';

interface Particle {
  x: number; y: number;
  vx: number; vy: number;
  size: number;
  opacity: number;
  life: number;
  maxLife: number;
  hue: number;
}

export default function ArchiveParticles() {
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

    let particles: Particle[] = [];
    let animId: number;

    function resize() {
      canvas!.width = window.innerWidth;
      canvas!.height = window.innerHeight;
    }

    function spawn(count: number) {
      for (let i = 0; i < count; i++) {
        particles.push({
          x: Math.random() * canvas!.width,
          y: Math.random() * canvas!.height,
          vx: (Math.random() - 0.5) * 0.3,
          vy: -0.1 - Math.random() * 0.4,
          size: 0.6 + Math.random() * 2.2,
          opacity: 0,
          life: 0,
          maxLife: 200 + Math.random() * 400,
          hue: 30 + Math.random() * 25,
        });
      }
    }

    function draw() {
      const w = canvas!.width;
      const h = canvas!.height;
      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;

      ctx!.clearRect(0, 0, w, h);

      // Maintain ~55 particles
      if (particles.length < 55) spawn(3);

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];

        // Mouse avoidance
        const dx = p.x - mx;
        const dy = p.y - my;
        const dist = Math.hypot(dx, dy);
        if (dist < 120 && dist > 0) {
          const force = (1 - dist / 120) * 0.4;
          p.vx += (dx / dist) * force;
          p.vy += (dy / dist) * force;
        }

        // Damping
        p.vx *= 0.995;
        p.vy *= 0.995;

        p.x += p.vx;
        p.y += p.vy;

        // Lifecycle
        p.life++;
        if (p.life < 40) {
          p.opacity = p.life / 40 * 0.5;
        } else if (p.life > p.maxLife - 40) {
          p.opacity = (p.maxLife - p.life) / 40 * 0.5;
        }

        // Wrap around edges
        if (p.x < -20) p.x = w + 20;
        if (p.x > w + 20) p.x = -20;
        if (p.y < -20) { p.y = h + 20; p.x = Math.random() * w; }
        if (p.y > h + 20) { p.y = -20; p.x = Math.random() * w; }

        // Remove dead particles
        if (p.life >= p.maxLife) {
          particles.splice(i, 1);
          continue;
        }

        // Draw
        if (p.opacity > 0.01) {
          ctx!.beginPath();
          ctx!.arc(p.x, p.y, p.size, 0, Math.PI * 2);

          // Warm golden glow
          const grad = ctx!.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 3);
          grad.addColorStop(0, `hsla(${p.hue}, 60%, 70%, ${p.opacity})`);
          grad.addColorStop(0.5, `hsla(${p.hue}, 50%, 60%, ${p.opacity * 0.3})`);
          grad.addColorStop(1, 'transparent');
          ctx!.fillStyle = grad;
          ctx!.fill();
        }
      }

      animId = requestAnimationFrame(draw);
    }

    resize();
    window.addEventListener('resize', resize);
    spawn(30);
    animId = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 1 }}
    />
  );
}
