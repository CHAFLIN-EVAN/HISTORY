import { useEffect, useRef } from 'react';

interface Dot {
  x: number; y: number;
  originX: number; originY: number;
  amplitude: number;
  frequency: number;
  phase: number;
  r: number;
  opacity: number;
  poolId: number;
}

interface InkPool {
  cx: number; cy: number;
  radius: number;
  driftVx: number; driftVy: number;
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
  const poolsRef = useRef<InkPool[]>([]);

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

    function initPools() {
      const w = canvas!.width;
      const h = canvas!.height;
      const pools: InkPool[] = [];
      const count = 5 + Math.floor(Math.random() * 3);
      for (let i = 0; i < count; i++) {
        pools.push({
          cx: Math.random() * w,
          cy: Math.random() * h,
          radius: 100 + Math.random() * 180,
          driftVx: (Math.random() - 0.5) * 0.12,
          driftVy: (Math.random() - 0.5) * 0.1,
        });
      }
      poolsRef.current = pools;
      return pools;
    }

    function initDots() {
      const w = canvas!.width;
      const h = canvas!.height;
      const pools = initPools();
      dots = [];

      const baseSpacing = 14;
      const cols = Math.ceil(w / baseSpacing) + 2;
      const rows = Math.ceil(h / baseSpacing) + 2;

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const gx = c * baseSpacing;
          const gy = r * baseSpacing;

          let px = gx + (Math.random() - 0.5) * baseSpacing * 0.9;
          let py = gy + (Math.random() - 0.5) * baseSpacing * 0.9;
          px = Math.max(-10, Math.min(w + 10, px));
          py = Math.max(-10, Math.min(h + 10, py));

          let poolId = -1;
          let minDist = Infinity;
          for (let pi = 0; pi < pools.length; pi++) {
            const p = pools[pi];
            const d = Math.hypot(px - p.cx, py - p.cy);
            if (d < minDist) { minDist = d; poolId = pi; }
          }

          const pool = pools[poolId];
          const distToPool = Math.hypot(px - pool.cx, py - pool.cy);
          const influence = Math.max(0, 1 - distToPool / pool.radius);
          const poolFactor = 0.3 + influence * 0.7;

          dots.push({
            x: px, y: py,
            originX: px, originY: py,
            amplitude: 1 + Math.random() * 7 * poolFactor,
            frequency: 0.2 + Math.random() * 0.8,
            phase: Math.random() * Math.PI * 2,
            r: 0.3 + Math.random() * 0.9 * poolFactor,
            opacity: 0.06 + Math.random() * 0.2 + influence * 0.18,
            poolId,
          });

          if (influence > 0.5 && Math.random() < influence * 0.6) {
            dots.push({
              x: px + (Math.random() - 0.5) * baseSpacing * 0.5,
              y: py + (Math.random() - 0.5) * baseSpacing * 0.5,
              originX: px, originY: py,
              amplitude: 1 + Math.random() * 4,
              frequency: 0.3 + Math.random() * 0.6,
              phase: Math.random() * Math.PI * 2,
              r: 0.2 + Math.random() * 0.5,
              opacity: 0.04 + Math.random() * 0.12,
              poolId,
            });
          }
        }
      }
    }

    function spawnShootingStar() {
      const fromLeft = Math.random() > 0.5;
      shootingStarsRef.current.push({
        x: fromLeft ? -50 : canvas!.width + 50,
        y: Math.random() * canvas!.height * 0.6,
        vx: fromLeft ? 3 + Math.random() * 4 : -(3 + Math.random() * 4),
        vy: 0.3 + Math.random() * 2,
        life: 0,
        maxLife: 70 + Math.random() * 80,
        len: 50 + Math.random() * 120,
        opacity: 0.12 + Math.random() * 0.3,
      });
    }

    function resize() {
      canvas!.width = window.innerWidth;
      canvas!.height = window.innerHeight;
      initDots();
    }

    function draw() {
      time += 0.006;
      spawnTimer++;

      if (spawnTimer > 400 && Math.random() < 0.005 && shootingStarsRef.current.length < 2) {
        spawnShootingStar();
        spawnTimer = 0;
      }

      const pools = poolsRef.current;
      for (const p of pools) {
        p.cx += p.driftVx;
        p.cy += p.driftVy;
        if (p.cx < -p.radius) p.cx = canvas!.width + p.radius;
        if (p.cx > canvas!.width + p.radius) p.cx = -p.radius;
        if (p.cy < -p.radius) p.cy = canvas!.height + p.radius;
        if (p.cy > canvas!.height + p.radius) p.cy = -p.radius;
      }

      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;
      const w = canvas!.width;
      const h = canvas!.height;
      const cx = w / 2;
      const cy = h / 2;

      // Semi-transparent clear for subtle trail on light bg
      ctx!.fillStyle = 'rgba(247,245,240,0.25)';
      ctx!.fillRect(0, 0, w, h);

      for (const d of dots) {
        const swell1 = Math.sin(d.originX * 0.0015 + time * 0.25 + d.phase) * d.amplitude * 1.2;
        const swell2 = Math.cos((d.originX + d.originY) * 0.002 + time * 0.4 + d.phase * 1.3) * d.amplitude * 0.7;
        const swell3 = Math.sin(d.originY * 0.003 - time * 0.35 + d.phase * 0.7) * d.amplitude * 0.5;
        const pool = pools[d.poolId];
        const distPool = Math.hypot(d.originX - pool.cx, d.originY - pool.cy);
        const poolInfluence = Math.max(0, 1 - distPool / pool.radius);
        const swell4 = Math.sin(distPool * 0.008 - time * 0.3) * poolInfluence * d.amplitude * 0.9;

        const offsetX = swell1 * 0.6 + swell2 * 0.4 + swell4 * 0.8;
        const offsetY = swell1 * 0.4 + swell2 * 0.5 + swell3 + swell4 * 0.6;

        const parallaxFactor = 0.01 + d.poolId / pools.length * 0.05;
        const parallaxX = (mx - cx) * parallaxFactor * -0.04;
        const parallaxY = (my - cy) * parallaxFactor * -0.04;

        const dx = (d.originX + offsetX + parallaxX) - mx;
        const dy = (d.originY + offsetY + parallaxY) - my;
        const dist = Math.hypot(dx, dy);
        const mouseRadius = 160;
        let mouseOffsetX = 0;
        let mouseOffsetY = 0;
        let mouseBoost = 0;

        if (dist < mouseRadius) {
          const force = (1 - dist / mouseRadius) ** 2;
          const angle = Math.atan2(dy, dx);
          const pushDist = force * 55;
          mouseOffsetX = Math.cos(angle) * pushDist;
          mouseOffsetY = Math.sin(angle) * pushDist;
          mouseBoost = force * 0.4;
        }

        const px = d.originX + offsetX + parallaxX + mouseOffsetX;
        const py = d.originY + offsetY + parallaxY + mouseOffsetY;

        if (py < -20 || py > h + 20 || px < -20 || px > w + 20) continue;

        const alpha = Math.min(0.7, d.opacity + mouseBoost * 0.5);

        // Ink wash glow
        if (poolInfluence > 0.3 && d.r > 0.5) {
          ctx!.beginPath();
          ctx!.arc(px, py, d.r * 4, 0, Math.PI * 2);
          const washGrad = ctx!.createRadialGradient(px, py, d.r * 0.5, px, py, d.r * 4);
          washGrad.addColorStop(0, `rgba(180,160,130,${alpha * 0.1})`);
          washGrad.addColorStop(1, 'rgba(180,160,130,0)');
          ctx!.fillStyle = washGrad;
          ctx!.fill();
        }

        // Cursor glow
        if (mouseBoost > 0.04) {
          ctx!.beginPath();
          ctx!.arc(px, py, d.r * 5, 0, Math.PI * 2);
          ctx!.fillStyle = `rgba(140,125,100,${alpha * 0.08})`;
          ctx!.fill();
        }

        // Dot — dark on light background
        const size = d.r * (0.5 + poolInfluence * 0.5);
        ctx!.beginPath();
        ctx!.arc(px, py, size, 0, Math.PI * 2);
        ctx!.fillStyle = `rgba(60,50,40,${alpha})`;
        ctx!.fill();
      }

      // Shooting stars
      const ssList = shootingStarsRef.current;
      for (let i = ssList.length - 1; i >= 0; i--) {
        const s = ssList[i];
        s.life++;
        if (s.life >= s.maxLife) { ssList.splice(i, 1); continue; }
        s.x += s.vx;
        s.y += s.vy;
        const progress = s.life / s.maxLife;
        const fade = progress < 0.2 ? progress / 0.2 : 1 - (progress - 0.2) / 0.8;

        const trailLen = s.len * fade;
        const angle = Math.atan2(s.vy, s.vx);
        const tx = s.x - Math.cos(angle) * trailLen;
        const ty = s.y - Math.sin(angle) * trailLen;

        const grad = ctx!.createLinearGradient(s.x, s.y, tx, ty);
        grad.addColorStop(0, `rgba(80,65,50,${s.opacity * fade})`);
        grad.addColorStop(1, 'rgba(80,65,50,0)');
        ctx!.beginPath();
        ctx!.moveTo(s.x, s.y);
        ctx!.lineTo(tx, ty);
        ctx!.strokeStyle = grad;
        ctx!.lineWidth = 1;
        ctx!.stroke();

        ctx!.beginPath();
        ctx!.arc(s.x, s.y, 1.5, 0, Math.PI * 2);
        ctx!.fillStyle = `rgba(80,65,50,${s.opacity * fade * 1.5})`;
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
