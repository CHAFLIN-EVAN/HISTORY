import { useEffect, useRef } from 'react';

interface Dot {
  x: number; y: number;
  baseY: number;
  amplitude: number;
  frequency: number;
  phase: number;
  r: number;
  depth: number;
}

interface ShootingStar {
  x: number; y: number;
  vx: number; vy: number;
  life: number;
  maxLife: number;
  len: number;
  opacity: number;
}

export default function Starfield() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: -999, y: -999 });
  const shootingStarsRef = useRef<ShootingStar[]>([]);

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
    let spawnTimer = 0;

    function resize() {
      canvas!.width = window.innerWidth;
      canvas!.height = window.innerHeight;
      initDots();
    }

    function initDots() {
      const spacing = 22;
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
            r: 0.4 + Math.random() * 0.9,
            depth: Math.random(),
          });
        }
      }
    }

    function spawnShootingStar() {
      const fromLeft = Math.random() > 0.5;
      shootingStarsRef.current.push({
        x: fromLeft ? -50 : canvas!.width + 50,
        y: Math.random() * canvas!.height * 0.6,
        vx: fromLeft ? 4 + Math.random() * 3 : -(4 + Math.random() * 3),
        vy: 0.5 + Math.random() * 2,
        life: 0,
        maxLife: 80 + Math.random() * 60,
        len: 60 + Math.random() * 100,
        opacity: 0.2 + Math.random() * 0.5,
      });
    }

    function draw() {
      time += 0.008;
      spawnTimer++;

      // Occasional shooting star
      if (spawnTimer > 300 && Math.random() < 0.008 && shootingStarsRef.current.length < 2) {
        spawnShootingStar();
        spawnTimer = 0;
      }

      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;
      const w = canvas!.width;
      const h = canvas!.height;
      const cx = w / 2;
      const cy = h / 2;

      ctx!.clearRect(0, 0, w, h);

      // Draw dots with depth parallax
      for (const d of dots) {
        const wave1 = Math.sin(d.x * 0.003 + time * 0.4 + d.phase) * d.amplitude;
        const wave2 = Math.cos(d.y * 0.004 + time * 0.6 + d.phase) * d.amplitude * 0.5;
        const wave3 = Math.sin((d.x + d.y) * 0.002 + time * 0.35) * d.amplitude * 0.7;
        const offsetY = wave1 + wave2 + wave3;

        // Depth parallax: far dots move less relative to mouse
        const parallaxFactor = 0.02 + d.depth * 0.06;
        const parallaxX = (mx - cx) * parallaxFactor * -0.03;
        const parallaxY = (my - cy) * parallaxFactor * -0.03;

        // Mouse repulsion ripple
        const dx = (d.x + parallaxX) - mx;
        const dy = (d.baseY + offsetY + parallaxY) - my;
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
          mouseBoost = force * 0.5;
        }

        const px = d.x + parallaxX + mouseOffsetX;
        const py = d.baseY + offsetY + parallaxY + mouseOffsetY;

        if (py < -20 || py > h + 20 || px < -20 || px > w + 20) continue;

        const distFromWave = Math.abs(offsetY) / 18;
        const depthAlpha = 0.15 + d.depth * 0.35;
        let alpha = depthAlpha + Math.min(distFromWave, 0.3) + mouseBoost;
        if (alpha > 0.8) alpha = 0.8;

        // Larger glow near cursor
        if (mouseBoost > 0.06) {
          ctx!.beginPath();
          ctx!.arc(px, py, d.r * 5, 0, Math.PI * 2);
          ctx!.fillStyle = `rgba(255,255,255,${alpha * 0.15})`;
          ctx!.fill();
        }

        // Dot with depth-based size
        const size = d.r * (0.6 + d.depth * 0.8);
        ctx!.beginPath();
        ctx!.arc(px, py, size, 0, Math.PI * 2);
        ctx!.fillStyle = `rgba(255,255,255,${alpha})`;
        ctx!.fill();
      }

      // Draw shooting stars
      const ssList = shootingStarsRef.current;
      for (let i = ssList.length - 1; i >= 0; i--) {
        const s = ssList[i];
        s.life++;
        if (s.life >= s.maxLife) {
          ssList.splice(i, 1);
          continue;
        }

        s.x += s.vx;
        s.y += s.vy;
        const progress = s.life / s.maxLife;
        const fade = progress < 0.2 ? progress / 0.2 : 1 - (progress - 0.2) / 0.8;

        // Trail
        const trailLen = s.len * fade;
        const angle = Math.atan2(s.vy, s.vx);
        const tx = s.x - Math.cos(angle) * trailLen;
        const ty = s.y - Math.sin(angle) * trailLen;

        const grad = ctx!.createLinearGradient(s.x, s.y, tx, ty);
        grad.addColorStop(0, `rgba(255,255,255,${s.opacity * fade})`);
        grad.addColorStop(1, 'rgba(255,255,255,0)');

        ctx!.beginPath();
        ctx!.moveTo(s.x, s.y);
        ctx!.lineTo(tx, ty);
        ctx!.strokeStyle = grad;
        ctx!.lineWidth = 1.2;
        ctx!.stroke();

        // Head glow
        ctx!.beginPath();
        ctx!.arc(s.x, s.y, 2, 0, Math.PI * 2);
        ctx!.fillStyle = `rgba(255,255,255,${s.opacity * fade * 1.5})`;
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
