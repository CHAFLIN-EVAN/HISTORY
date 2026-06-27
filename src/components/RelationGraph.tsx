import { useEffect, useRef, useCallback } from 'react';
import type { HistoricalFigure } from '../types';

interface Props {
  figures: HistoricalFigure[];
}

interface Node {
  x: number; y: number; vx: number; vy: number;
  figure: HistoricalFigure;
  radius: number;
  hovered: boolean;
}

interface Edge {
  from: number; to: number;
}

export default function RelationGraph({ figures }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const nodesRef = useRef<Node[]>([]);
  const edgesRef = useRef<Edge[]>([]);
  const mouseRef = useRef({ x: -999, y: -999, down: false });
  const dragRef = useRef<{ node: Node; ox: number; oy: number } | null>(null);
  const sizeRef = useRef({ w: 600, h: 420 });
  const animRef = useRef<number>(0);

  const initGraph = useCallback(() => {
    const { w, h } = sizeRef.current;
    const cx = w / 2;
    const cy = h / 2;
    const r = Math.min(w, h) * 0.35;

    const nodes: Node[] = figures.map((f, i) => {
      const angle = (i / figures.length) * Math.PI * 2 - Math.PI / 2;
      return {
        x: cx + Math.cos(angle) * r + (Math.random() - 0.5) * 40,
        y: cy + Math.sin(angle) * r + (Math.random() - 0.5) * 40,
        vx: 0, vy: 0,
        figure: f,
        radius: 16 + Math.min(f.name.length * 2, 24),
        hovered: false,
      };
    });

    const edges: Edge[] = [];
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i].figure;
        const b = nodes[j].figure;
        const share = a.title.split(/[，,、\s·]+/).some((w: string) =>
          w.length > 1 && b.title.includes(w)
        ) || a.description.split(/[，,、\s·]+/).some((w: string) =>
          w.length > 1 && b.description.includes(w)
        );
        // Connect all nodes in same rough group, plus any keyword-sharing pairs
        if (share || (i < Math.ceil(figures.length / 3) && j < Math.ceil(figures.length / 3))) {
          edges.push({ from: i, to: j });
        }
      }
    }

    nodesRef.current = nodes;
    edgesRef.current = edges;
  }, [figures]);

  // Resize canvas to match display size
  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        const dpr = window.devicePixelRatio || 1;
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        canvas.style.width = width + 'px';
        canvas.style.height = height + 'px';
        sizeRef.current = { w: width * dpr, h: height * dpr };
        initGraph();
      }
    });
    ro.observe(container);
    return () => ro.disconnect();
  }, [initGraph]);

  // Mouse events on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    function getPos(e: MouseEvent) {
      const rect = canvas!.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      return {
        x: (e.clientX - rect.left) * dpr,
        y: (e.clientY - rect.top) * dpr,
      };
    }

    function onDown(e: MouseEvent) {
      mouseRef.current.down = true;
      const { x, y } = getPos(e);
      const nodes = nodesRef.current;
      for (const n of nodes) {
        if (Math.hypot(n.x - x, n.y - y) < n.radius + 4) {
          dragRef.current = { node: n, ox: n.x - x, oy: n.y - y };
          break;
        }
      }
    }

    function onUp() {
      mouseRef.current.down = false;
      dragRef.current = null;
    }

    function onMove(e: MouseEvent) {
      const { x, y } = getPos(e);
      mouseRef.current = { ...mouseRef.current, x, y };
      if (dragRef.current) {
        dragRef.current.node.x = x + dragRef.current.ox;
        dragRef.current.node.y = y + dragRef.current.oy;
        dragRef.current.node.vx = 0;
        dragRef.current.node.vy = 0;
      }
    }

    canvas.addEventListener('mousedown', onDown);
    window.addEventListener('mouseup', onUp);
    canvas.addEventListener('mousemove', onMove);
    canvas.addEventListener('mouseleave', onUp);

    return () => {
      canvas.removeEventListener('mousedown', onDown);
      window.removeEventListener('mouseup', onUp);
      canvas.removeEventListener('mousemove', onMove);
      canvas.removeEventListener('mouseleave', onUp);
    };
  }, [figures]);

  // Animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    function simulate() {
      const { w, h } = sizeRef.current;
      const cx = w / 2;
      const cy = h / 2;
      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;
      const nodes = nodesRef.current;
      const edges = edgesRef.current;
      const dpr = window.devicePixelRatio || 1;

      ctx!.save();
      ctx!.scale(dpr, dpr);
      const W = w / dpr;
      const H = h / dpr;

      // Forces
      for (const n of nodes) {
        if (dragRef.current?.node === n) continue;

        n.vx += (cx / dpr - n.x / dpr) * 0.0003;
        n.vy += (cy / dpr - n.y / dpr) * 0.0003;

        const dx = n.x / dpr - mx / dpr;
        const dy = n.y / dpr - my / dpr;
        const dist = Math.hypot(dx, dy);
        if (dist < 100 && dist > 0) {
          const force = (1 - dist / 100) ** 2 * 2.5;
          n.vx += (dx / dist) * force;
          n.vy += (dy / dist) * force;
        }

        for (const other of nodes) {
          if (other === n) continue;
          const dx2 = (n.x - other.x) / dpr;
          const dy2 = (n.y - other.y) / dpr;
          const d2 = Math.hypot(dx2, dy2);
          const minDist = (n.radius + other.radius) / dpr + 8;
          if (d2 < minDist && d2 > 0) {
            const f = (1 - d2 / minDist) ** 2 * 1.2;
            n.vx += (dx2 / d2) * f;
            n.vy += (dy2 / d2) * f;
          }
        }

        n.vx *= 0.9;
        n.vy *= 0.9;
        n.x += n.vx * dpr;
        n.y += n.vy * dpr;

        if (n.x < n.radius) { n.x = n.radius; n.vx *= -0.5; }
        if (n.x > w - n.radius) { n.x = w - n.radius; n.vx *= -0.5; }
        if (n.y < n.radius) { n.y = n.radius; n.vy *= -0.5; }
        if (n.y > h - n.radius) { n.y = h - n.radius; n.vy *= -0.5; }

        n.hovered = Math.hypot(n.x - mx, n.y - my) < n.radius + 8;
      }

      for (const e of edges) {
        const a = nodes[e.from];
        const b = nodes[e.to];
        const dx = (a.x - b.x) / dpr;
        const dy = (a.y - b.y) / dpr;
        const dist = Math.hypot(dx, dy);
        if (dist > 20 && dist > 0) {
          const force = (dist - 60) * 0.0015;
          const fx = (dx / dist) * force;
          const fy = (dy / dist) * force;
          a.vx -= fx * dpr;
          a.vy -= fy * dpr;
          b.vx += fx * dpr;
          b.vy += fy * dpr;
        }
      }

      // Draw
      ctx!.clearRect(0, 0, W, H);

      // Edges
      for (const e of edges) {
        const a = nodes[e.from];
        const b = nodes[e.to];
        const active = a.hovered || b.hovered;
        ctx!.beginPath();
        ctx!.moveTo(a.x / dpr, a.y / dpr);
        ctx!.lineTo(b.x / dpr, b.y / dpr);
        ctx!.strokeStyle = active ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.05)';
        ctx!.lineWidth = active ? 1.5 : 0.4;
        ctx!.stroke();
      }

      // Nodes
      for (const n of nodes) {
        const nx = n.x / dpr;
        const ny = n.y / dpr;
        const r = n.radius / dpr;
        const hovered = n.hovered;

        if (hovered) {
          const grd = ctx!.createRadialGradient(nx, ny, r * 0.3, nx, ny, r * 2.5);
          grd.addColorStop(0, 'rgba(255,255,255,0.18)');
          grd.addColorStop(1, 'rgba(255,255,255,0)');
          ctx!.beginPath();
          ctx!.arc(nx, ny, r * 2.5, 0, Math.PI * 2);
          ctx!.fillStyle = grd;
          ctx!.fill();
        }

        ctx!.beginPath();
        ctx!.arc(nx, ny, r, 0, Math.PI * 2);
        ctx!.fillStyle = hovered ? 'rgba(255,255,255,0.16)' : 'rgba(255,255,255,0.07)';
        ctx!.fill();
        ctx!.strokeStyle = hovered ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.18)';
        ctx!.lineWidth = hovered ? 1.5 : 0.6;
        ctx!.stroke();

        const fontSize = hovered ? 11 : 9;
        ctx!.font = `${fontSize}px "PingFang SC", "Microsoft YaHei", sans-serif`;
        ctx!.fillStyle = hovered ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.65)';
        ctx!.textAlign = 'center';
        ctx!.textBaseline = 'middle';
        ctx!.fillText(n.figure.name, nx, ny);

        if (hovered) {
          ctx!.font = '8px "PingFang SC", "Microsoft YaHei", sans-serif';
          ctx!.fillStyle = 'rgba(255,255,255,0.5)';
          ctx!.fillText(n.figure.title, nx, ny + r + 10);
        }
      }

      ctx!.restore();
      animRef.current = requestAnimationFrame(simulate);
    }

    animRef.current = requestAnimationFrame(simulate);
    return () => cancelAnimationFrame(animRef.current);
  }, []);

  return (
    <div ref={containerRef} className="w-full h-[420px] rounded-xl border border-white/[0.06] overflow-hidden bg-white/[0.02]">
      <canvas
        ref={canvasRef}
        className="w-full h-full block"
      />
    </div>
  );
}
