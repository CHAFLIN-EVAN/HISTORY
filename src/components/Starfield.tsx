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
      const count = 6 + Math.floor(Math.random() * 4);
      for (let i = 0; i < count; i++) {
        pools.push({
          cx: Math.random() * w,
          cy: Math.random() * h,
          radius: 80 + Math.random() * 200,
          driftVx: (Math.random() - 0.5) * 0.15,
          driftVy: (Math.random() - 0.5) * 0.12,
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

      // Organic distribution: base grid with perturbation + ink pool concentration
      const baseSpacing = 15;
      const cols = Math.ceil(w / baseSpacing) + 2;
      const rows = Math.ceil(h / baseSpacing) + 2;

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const gx = c * baseSpacing;
          const gy = r * baseSpacing;

          // Random perturbation from grid
          let px = gx + (Math.random() - 0.5) * baseSpacing * 0.9;
          let py = gy + (Math.random() - 0.5) * baseSpacing * 0.9;

          // Clamp to canvas
          px = Math.max(-10, Math.min(w + 10, px));
          py = Math.max(-10, Math.min(h + 10, py));

          // Find nearest ink pool for this dot
          let poolId = -1;
          let minDist = Infinity;
          for (let pi = 0; pi < pools.length; pi++) {
            const p = pools[pi];
            const d = Math.hypot(px - p.cx, py - p.cy);
            if (d < minDist) { minDist = d; poolId = pi; }
          }

          // Pool influence: higher density near pool centers
          const pool = pools[poolId];
          const distToPool = Math.hypot(px - pool.cx, py - pool.cy);
          const influence = Math.max(0, 1 - distToPool / pool.radius);

          // Base dot always exists
          const poolFactor = 0.3 + influence * 0.7;
          dots.push({
            x: px, y: py,
            originX: px, originY: py,
            amplitude: 1 + Math.random() * 8 * poolFactor,
            frequency: 0.2 + Math.random() * 0.8,
            phase: Math.random() * Math.PI * 2,
            r: 0.3 + Math.random() * 1.0 * poolFactor,
            opacity: 0.08 + Math.random() * 0.25 + influence * 0.2,
            poolId,
          });

          // Extra dots in high-density ink pool areas
          if (influence > 0.5 && Math.random() < influence * 0.7) {
            const ex = px + (Math.random() - 0.5) * baseSpacing * 0.6;
            const ey = py + (Math.random() - 0.5) * baseSpacing * 0.6;
            dots.push({
              x: ex, y: ey,
              originX: ex, originY: ey,
              amplitude: 1 + Math.random() * 5,
              frequency: 0.3 + Math.random() * 0.6,
              phase: Math.random() * Math.PI * 2,
              r: 0.2 + Math.random() * 0.6,
              opacity: 0.05 + Math.random() * 0.15,
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
        opacity: 0.15 + Math.random() * 0.4,
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

      if (spawnTimer > 400 && Math.random() < 0.006 && shootingStarsRef.current.length < 2) {
        spawnShootingStar();
        spawnTimer = 0;
      }

      // Drift ink pools slowly
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

      // Semi-transparent clear for subtle trail
      ctx!.fillStyle = 'rgba(0,0,0,0.22)';
      ctx!.fillRect(0, 0, w, h);

      for (const d of dots) {
        // Multi-layer fluid wave system
        // Layer 1: Large slow horizontal swells (tide)
        const swell1 = Math.sin(d.originX * 0.0015 + time * 0.25 + d.phase) * d.amplitude * 1.2;
        // Layer 2: Medium diagonal ripple
        const swell2 = Math.cos((d.originX + d.originY) * 0.002 + time * 0.4 + d.phase * 1.3) * d.amplitude * 0.7;
        // Layer 3: Fine cross-ripple
        const swell3 = Math.sin(d.originY * 0.003 - time * 0.35 + d.phase * 0.7) * d.amplitude * 0.5;
        // Layer 4: Ink diffusion — slow organic movement influenced by pool
        const pool = pools[d.poolId];
        const distPool = Math.hypot(d.originX - pool.cx, d.originY - pool.cy);
        const poolInfluence = Math.max(0, 1 - distPool / pool.radius);
        const swell4 = Math.sin(distPool * 0.008 - time * 0.3) * poolInfluence * d.amplitude * 0.9;

        const offsetX = swell1 * 0.6 + swell2 * 0.4 + swell4 * 0.8;
        const offsetY = swell1 * 0.4 + swell2 * 0.5 + swell3 + swell4 * 0.6;

        // Depth parallax
        const parallaxFactor = 0.01 + d.poolId / pools.length * 0.05;
        const parallaxX = (mx - cx) * parallaxFactor * -0.04;
        const parallaxY = (my - cy) * parallaxFactor * -0.04;

        // Mouse repulsion
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
          mouseBoost = force * 0.45;
        }

        const px = d.originX + offsetX + parallaxX + mouseOffsetX;
        const py = d.originY + offsetY + parallaxY + mouseOffsetY;

        if (py < -20 || py > h + 20 || px < -20 || px > w + 20) continue;

        const alpha = Math.min(0.85, d.opacity + mouseBoost * 0.6);

        // Ink wash glow: larger faint halo around some dots in pool areas
        if (poolInfluence > 0.3 && d.r > 0.6) {
          ctx!.beginPath();
          ctx!.arc(px, py, d.r * 4, 0, Math.PI * 2);
          const washGrad = ctx!.createRadialGradient(px, py, d.r * 0.5, px, py, d.r * 4);
          washGrad.addColorStop(0, `rgba(255,255,255,${alpha * 0.12})`);
          washGrad.addColorStop(1, 'rgba(255,255,255,0)');
          ctx!.fillStyle = washGrad;
          ctx!.fill();
        }

        // Cursor glow
        if (mouseBoost > 0.05) {
          ctx!.beginPath();
          ctx!.arc(px, py, d.r * 6, 0, Math.PI * 2);
          ctx!.fillStyle = `rgba(255,255,255,${alpha * 0.1})`;
          ctx!.fill();
        }

        // Main dot
        const size = d.r * (0.5 + poolInfluence * 0.5);
        ctx!.beginPath();
        ctx!.arc(px, py, size, 0, Math.PI * 2);
        ctx!.fillStyle = `rgba(255,255,255,${alpha})`;
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
        grad.addColorStop(0, `rgba(255,255,255,${s.opacity * fade})`);
        grad.addColorStop(1, 'rgba(255,255,255,0)');
        ctx!.beginPath();
        ctx!.moveTo(s.x, s.y);
        ctx!.lineTo(tx, ty);
        ctx!.strokeStyle = grad;
        ctx!.lineWidth = 1;
        ctx!.stroke();

        ctx!.beginPath();
        ctx!.arc(s.x, s.y, 1.5, 0, Math.PI * 2);
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
