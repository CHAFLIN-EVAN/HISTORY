import { useEffect, useRef, useCallback, useState } from 'react';
import type { HistoricalFigure } from '../types';

interface Props {
  figures: HistoricalFigure[];
}

interface GraphNode {
  x: number; y: number; vx: number; vy: number;
  figure: HistoricalFigure;
  radius: number;
  index: number;
}

interface GraphEdge {
  from: number; to: number;
  label: string;
}

/** Extract common Chinese substrings (≥2 chars) between two strings */
function sharedKeywords(a: string, b: string): string[] {
  const found: string[] = [];
  // Split by punctuation to get segments
  const segA = a.split(/[，,、\s·。；;：:（）\(\)《》"、]+/).filter(s => s.length >= 2);
  const segB = b.split(/[，,、\s·。；;：:（）\(\)《》"、]+/).filter(s => s.length >= 2);

  for (const sa of segA) {
    for (const sb of segB) {
      if (sa === sb) { found.push(sa); continue; }
      if (sa.length > sb.length && sa.includes(sb)) { found.push(sb); continue; }
      if (sb.length > sa.length && sb.includes(sa)) { found.push(sa); continue; }
    }
  }
  // Also try sliding window for longer texts
  if (found.length === 0 && a.length > 3 && b.length > 3) {
    for (let w = 4; w >= 2; w--) {
      for (let i = 0; i <= a.length - w; i++) {
        const sub = a.slice(i, i + w);
        if (b.includes(sub) && !/[，,、\s·。；;：:（）\(\)《》"、]/.test(sub)) {
          found.push(sub);
          if (found.length >= 2) break;
        }
      }
      if (found.length > 0) break;
    }
  }
  return [...new Set(found)].slice(0, 2);
}

function buildEdges(nodes: GraphNode[], figureCount: number): GraphEdge[] {
  const edges: GraphEdge[] = [];
  const added = new Set<string>();

  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const a = nodes[i].figure;
      const b = nodes[j].figure;

      // Find shared keywords from titles
      const titleShared = sharedKeywords(a.title, b.title);
      // Find shared keywords from descriptions
      const descShared = sharedKeywords(a.description, b.description);
      const allShared = [...titleShared, ...descShared];

      // Determine if connected
      const sameGroup = i < Math.ceil(figureCount / 3) && j < Math.ceil(figureCount / 3);
      const hasShared = allShared.length > 0;
      const connected = hasShared || sameGroup;

      if (connected) {
        const key = `${Math.min(i, j)}-${Math.max(i, j)}`;
        if (added.has(key)) continue;
        added.add(key);

        // Pick the most meaningful label: prefer title matches, then longest description match
        const label = titleShared[0] || descShared[0] || '';
        edges.push({ from: i, to: j, label });
      }
    }
  }
  return edges;
}

export default function RelationGraph({ figures }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const nodesRef = useRef<GraphNode[]>([]);
  const edgesRef = useRef<GraphEdge[]>([]);
  const mouseRef = useRef({ x: -999, y: -999 });
  const dragRef = useRef<{ node: GraphNode; ox: number; oy: number; moved: boolean } | null>(null);
  const sizeRef = useRef({ w: 600, h: 420 });
  const animRef = useRef<number>(0);
  const hoveredRef = useRef<number | null>(null);

  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [panelFigure, setPanelFigure] = useState<HistoricalFigure | null>(null);

  const selectFigure = useCallback((idx: number | null) => {
    if (idx === null) {
      setSelectedIdx(null);
      setPanelFigure(null);
    } else {
      setSelectedIdx(idx);
      setPanelFigure(nodesRef.current[idx]?.figure ?? null);
    }
  }, []);

  const initGraph = useCallback(() => {
    const { w, h } = sizeRef.current;
    const cx = w / 2;
    const cy = h / 2;
    const r = Math.min(w, h) * 0.32;

    const nodes: GraphNode[] = figures.map((f, i) => {
      const angle = (i / figures.length) * Math.PI * 2 - Math.PI / 2;
      return {
        x: cx + Math.cos(angle) * r + (Math.random() - 0.5) * 30,
        y: cy + Math.sin(angle) * r + (Math.random() - 0.5) * 30,
        vx: 0, vy: 0,
        figure: f,
        radius: 18 + Math.min(f.name.length * 2, 26),
        index: i,
      };
    });

    const edges = buildEdges(nodes, figures.length);

    nodesRef.current = nodes;
    edgesRef.current = edges;
    setSelectedIdx(null);
    setPanelFigure(null);
  }, [figures]);

  // Resize canvas
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

  // Mouse events
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
      const { x, y } = getPos(e);
      const nodes = nodesRef.current;
      for (const n of nodes) {
        if (Math.hypot(n.x - x, n.y - y) < n.radius + 6) {
          dragRef.current = { node: n, ox: n.x - x, oy: n.y - y, moved: false };
          break;
        }
      }
    }

    function onUp(_e: MouseEvent) {
      const drag = dragRef.current;
      if (drag && !drag.moved) {
        // It was a click — select the figure
        selectFigure(drag.node.index);
      }
      dragRef.current = null;
    }

    function onMove(e: MouseEvent) {
      const { x, y } = getPos(e);
      mouseRef.current = { x, y };

      const drag = dragRef.current;
      if (drag) {
        const dx = x - (drag.node.x - drag.ox);
        const dy = y - (drag.node.y - drag.oy);
        if (Math.abs(dx) > 2 || Math.abs(dy) > 2) drag.moved = true;
        drag.node.x = x + drag.ox;
        drag.node.y = y + drag.oy;
        drag.node.vx = 0;
        drag.node.vy = 0;
      }

      // Update hovered
      const nodes = nodesRef.current;
      let found: number | null = null;
      for (const n of nodes) {
        if (Math.hypot(n.x - x, n.y - y) < n.radius + 4) {
          found = n.index;
          break;
        }
      }
      const prev = hoveredRef.current;
      if (prev !== found) {
        hoveredRef.current = found;
        if (canvas) canvas.style.cursor = found !== null ? 'pointer' : 'default';
      }
    }

    canvas.addEventListener('mousedown', onDown);
    window.addEventListener('mouseup', onUp);
    canvas.addEventListener('mousemove', onMove);
    canvas.addEventListener('mouseleave', () => {
      dragRef.current = null;
      hoveredRef.current = null;
      if (canvas) canvas.style.cursor = 'default';
    });

    return () => {
      canvas.removeEventListener('mousedown', onDown);
      window.removeEventListener('mouseup', onUp);
      canvas.removeEventListener('mousemove', onMove);
    };
  }, [selectFigure]);

  // Click outside to deselect
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (!canvasRef.current?.contains(e.target as Node)) {
        selectFigure(null);
      }
    }
    window.addEventListener('mousedown', onClick);
    return () => window.removeEventListener('mousedown', onClick);
  }, [selectFigure]);

  // Animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    function drawEdgeLabel(x: number, y: number, text: string, active: boolean) {
      if (!text) return;
      const dpr = window.devicePixelRatio || 1;
      const fontSize = active ? 9 : 8;
      ctx!.font = `${fontSize * dpr}px "PingFang SC", "Microsoft YaHei", sans-serif`;
      const metrics = ctx!.measureText(text);
      const tw = metrics.width;
      const th = fontSize * dpr * 1.4;
      const px = x - tw / 2;
      const py = y - th / 2;

      // Pill background
      const padX = 5 * dpr;
      const padY = 2 * dpr;
      ctx!.beginPath();
      ctx!.roundRect(px - padX, py - padY, tw + padX * 2, th + padY * 2, 6 * dpr);
      ctx!.fillStyle = active ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.04)';
      ctx!.fill();

      // Text
      ctx!.fillStyle = active ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.25)';
      ctx!.textAlign = 'left';
      ctx!.textBaseline = 'top';
      ctx!.fillText(text, px, py);
    }

    function simulate() {
      const { w, h } = sizeRef.current;
      const cx = w / 2;
      const cy = h / 2;
      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;
      const nodes = nodesRef.current;
      const edges = edgesRef.current;
      const dpr = window.devicePixelRatio || 1;
      const selIdx = selectedIdx;
      const hovIdx = hoveredRef.current;

      ctx!.save();
      ctx!.scale(dpr, dpr);
      const W = w / dpr;
      const H = h / dpr;

      // Forces
      for (const n of nodes) {
        if (dragRef.current?.node === n) continue;

        n.vx += (cx / dpr - n.x / dpr) * 0.0004;
        n.vy += (cy / dpr - n.y / dpr) * 0.0004;

        const dx = n.x / dpr - mx / dpr;
        const dy = n.y / dpr - my / dpr;
        const dist = Math.hypot(dx, dy);
        if (dist < 100 && dist > 0) {
          const force = (1 - dist / 100) ** 2 * 2;
          n.vx += (dx / dist) * force;
          n.vy += (dy / dist) * force;
        }

        for (const other of nodes) {
          if (other === n) continue;
          const dx2 = (n.x - other.x) / dpr;
          const dy2 = (n.y - other.y) / dpr;
          const d2 = Math.hypot(dx2, dy2);
          const minDist = (n.radius + other.radius) / dpr + 10;
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
      }

      // Edge forces
      for (const e of edges) {
        const a = nodes[e.from];
        const b = nodes[e.to];
        const dx = (a.x - b.x) / dpr;
        const dy = (a.y - b.y) / dpr;
        const dist = Math.hypot(dx, dy);
        if (dist > 20 && dist > 0) {
          const force = (dist - 70) * 0.0012;
          const fx = (dx / dist) * force;
          const fy = (dy / dist) * force;
          a.vx -= fx * dpr;
          a.vy -= fy * dpr;
          b.vx += fx * dpr;
          b.vy += fy * dpr;
        }
      }

      // Build connected node set
      const connectedSet = new Set<number>();
      if (selIdx !== null) {
        connectedSet.add(selIdx);
        for (const e of edges) {
          if (e.from === selIdx) connectedSet.add(e.to);
          if (e.to === selIdx) connectedSet.add(e.from);
        }
      }

      // Draw
      ctx!.clearRect(0, 0, W, H);

      // Edges
      for (const e of edges) {
        const a = nodes[e.from];
        const b = nodes[e.to];
        const ax = a.x / dpr;
        const ay = a.y / dpr;
        const bx = b.x / dpr;
        const by = b.y / dpr;

        const isConnected = selIdx !== null &&
          (e.from === selIdx || e.to === selIdx);
        const isActive = isConnected ||
          (selIdx === null && (a.index === hovIdx || b.index === hovIdx));

        ctx!.beginPath();
        ctx!.moveTo(ax, ay);
        ctx!.lineTo(bx, by);
        ctx!.strokeStyle = isActive ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.06)';
        ctx!.lineWidth = isActive ? (isConnected ? 2 : 1.2) : 0.5;
        ctx!.stroke();

        // Label at midpoint
        if (e.label) {
          const mx2 = (ax + bx) / 2;
          const my2 = (ay + by) / 2;
          drawEdgeLabel(mx2 * dpr, my2 * dpr, e.label, isActive);
        }
      }

      // Nodes
      for (const n of nodes) {
        const nx = n.x / dpr;
        const ny = n.y / dpr;
        const r = n.radius / dpr;
        const isHovered = n.index === hovIdx;
        const isSelected = n.index === selIdx;
        const isConnectedToSelected = connectedSet.has(n.index) && n.index !== selIdx;

        // Outer glow for selected
        if (isSelected) {
          const glow = ctx!.createRadialGradient(nx, ny, r * 0.5, nx, ny, r * 3);
          glow.addColorStop(0, 'rgba(251,191,36,0.35)');
          glow.addColorStop(0.5, 'rgba(251,191,36,0.1)');
          glow.addColorStop(1, 'rgba(251,191,36,0)');
          ctx!.beginPath();
          ctx!.arc(nx, ny, r * 3, 0, Math.PI * 2);
          ctx!.fillStyle = glow;
          ctx!.fill();
        } else if (isConnectedToSelected) {
          const glow = ctx!.createRadialGradient(nx, ny, r * 0.5, nx, ny, r * 2.2);
          glow.addColorStop(0, 'rgba(255,255,255,0.15)');
          glow.addColorStop(1, 'rgba(255,255,255,0)');
          ctx!.beginPath();
          ctx!.arc(nx, ny, r * 2.2, 0, Math.PI * 2);
          ctx!.fillStyle = glow;
          ctx!.fill();
        } else if (isHovered) {
          const glow = ctx!.createRadialGradient(nx, ny, r * 0.3, nx, ny, r * 2.2);
          glow.addColorStop(0, 'rgba(255,255,255,0.12)');
          glow.addColorStop(1, 'rgba(255,255,255,0)');
          ctx!.beginPath();
          ctx!.arc(nx, ny, r * 2.2, 0, Math.PI * 2);
          ctx!.fillStyle = glow;
          ctx!.fill();
        }

        // Node circle
        ctx!.beginPath();
        ctx!.arc(nx, ny, r, 0, Math.PI * 2);
        ctx!.fillStyle = isSelected ? 'rgba(251,191,36,0.25)'
          : isConnectedToSelected ? 'rgba(255,255,255,0.12)'
          : isHovered ? 'rgba(255,255,255,0.14)'
          : 'rgba(255,255,255,0.06)';
        ctx!.fill();

        // Node border
        ctx!.strokeStyle = isSelected ? 'rgba(251,191,36,0.7)'
          : isConnectedToSelected ? 'rgba(255,255,255,0.4)'
          : isHovered ? 'rgba(255,255,255,0.45)'
          : 'rgba(255,255,255,0.15)';
        ctx!.lineWidth = isSelected ? 2 : isConnectedToSelected ? 1.2 : isHovered ? 1 : 0.5;
        ctx!.stroke();

        // Name
        const fontSize = isSelected ? 11 : isHovered || isConnectedToSelected ? 10 : 9;
        ctx!.font = `${fontSize}px "PingFang SC", "Microsoft YaHei", sans-serif`;
        ctx!.fillStyle = isSelected ? 'rgba(251,191,36,0.95)'
          : isConnectedToSelected ? 'rgba(255,255,255,0.85)'
          : isHovered ? 'rgba(255,255,255,0.9)'
          : 'rgba(255,255,255,0.6)';
        ctx!.textAlign = 'center';
        ctx!.textBaseline = 'middle';
        ctx!.fillText(n.figure.name, nx, ny);

        // Title below
        if (isHovered || isSelected || isConnectedToSelected) {
          ctx!.font = `${isSelected ? 9 : 8}px "PingFang SC", "Microsoft YaHei", sans-serif`;
          ctx!.fillStyle = isSelected ? 'rgba(251,191,36,0.6)'
            : 'rgba(255,255,255,0.4)';
          ctx!.fillText(n.figure.title, nx, ny + r + 10);
        }
      }

      ctx!.restore();
      animRef.current = requestAnimationFrame(simulate);
    }

    animRef.current = requestAnimationFrame(simulate);
    return () => cancelAnimationFrame(animRef.current);
  }, [selectedIdx]);

  return (
    <div className="w-full">
      {/* Graph canvas */}
      <div
        ref={containerRef}
        className="w-full h-[380px] rounded-xl border border-white/[0.06] overflow-hidden bg-white/[0.02] relative"
      >
        <canvas ref={canvasRef} className="w-full h-full block" />

        {/* Deselect hint */}
        {selectedIdx !== null && (
          <button
            onClick={() => selectFigure(null)}
            className="absolute top-2 right-2 text-[10px] text-white/25 hover:text-white/50 bg-white/[0.04] hover:bg-white/[0.08] px-2 py-0.5 rounded-full transition-colors"
          >
            取消选中
          </button>
        )}
      </div>

      {/* Detail panel */}
      {panelFigure && (
        <div className="mt-4 p-5 rounded-xl bg-white/[0.04] border border-amber-500/20 backdrop-blur-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-2 h-2 rounded-full bg-amber-400/70" />
            <h4 className="text-sm font-medium text-amber-200/90">{panelFigure.name}</h4>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300/60 border border-amber-500/15">
              {panelFigure.title}
            </span>
          </div>
          <p className="text-xs leading-relaxed text-white/55">{panelFigure.description}</p>

          {/* Show relationships */}
          {selectedIdx !== null && (() => {
            const relatedEdges = edgesRef.current.filter(e => e.from === selectedIdx || e.to === selectedIdx);
            if (relatedEdges.length === 0) return null;
            return (
              <div className="mt-3 pt-3 border-t border-white/[0.05]">
                <span className="text-[10px] text-white/25">关联人物：</span>
                <div className="flex gap-1.5 flex-wrap mt-1.5">
                  {relatedEdges.map((e, i) => {
                    const otherIdx = e.from === selectedIdx ? e.to : e.from;
                    const other = nodesRef.current[otherIdx];
                    if (!other) return null;
                    return (
                      <button
                        key={i}
                        onClick={() => selectFigure(otherIdx)}
                        className={`text-[10px] px-2 py-1 rounded-md transition-all ${
                          'bg-white/[0.04] text-white/50 hover:bg-white/[0.1] hover:text-white/80 border border-white/[0.06]'
                        }`}
                      >
                        {other.figure.name}
                        {e.label && <span className="text-white/18 ml-1">· {e.label}</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}
