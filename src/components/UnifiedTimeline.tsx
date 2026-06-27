import { useState, useRef, useCallback, useMemo } from 'react';
import type { DynastyNode } from '../types';
import { parsePeriodStart } from '../utils/period';
import TimelineCard from './TimelineCard';

interface Props {
  nodes: { node: DynastyNode; regionName: string }[];
  selectedId: string | null;
  highlightedIds: Set<string>;
  onSelect: (id: string) => void;
}

const MIN_SCALE = 0.3;
const MAX_SCALE = 2.5;
const BASE_PX_PER_YEAR = 2;
const CARD_W = 160;
const CARD_H = 112;
const CONNECTOR_H = 28;
const PADDING_X = 260;
const MARKER_INTERVAL = 500;

function formatYear(y: number): string {
  if (y < 0) return `前${-y}`;
  if (y === 0) return '公元元年';
  return `${y}`;
}

export default function UnifiedTimeline({ nodes, selectedId, highlightedIds, onSelect }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.6);
  const [translateX, setTranslateX] = useState(0);
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef({ x: 0, tx: 0 });
  const hasDragged = useRef(false);

  // Sort by parsed year, filter out items without parseable dates
  const sorted = useMemo(() => {
    return [...nodes]
      .map((item) => ({ ...item, year: parsePeriodStart(item.node.period) }))
      .filter((item) => isFinite(item.year))
      .sort((a, b) => a.year - b.year);
  }, [nodes]);

  const { minYear, maxYear, totalWidth } = useMemo(() => {
    if (sorted.length === 0) return { minYear: -3000, maxYear: 2000, totalWidth: 10000 };
    const years = sorted.map((s) => s.year);
    const minY = Math.min(...years);
    const maxY = Math.max(...years);
    const px = BASE_PX_PER_YEAR * scale;
    const w = (maxY - minY) * px + PADDING_X * 2;
    return { minYear: minY, maxYear: maxY, totalWidth: w };
  }, [sorted, scale]);

  function xForYear(year: number): number {
    return (year - minYear) * BASE_PX_PER_YEAR * scale + PADDING_X;
  }

  // Compute layout with stagger collision avoidance
  const layout = useMemo(() => {
    return sorted.map((item, i) => {
      const x = xForYear(item.year);
      let level = 0;
      const minDist = (CARD_W + 24) / scale;

      for (let j = i - 1; j >= 0 && j >= i - 6; j--) {
        const prevX = xForYear(sorted[j].year);
        if (Math.abs(x - prevX) < minDist && (sorted[j] as any)._level === level) {
          level++;
        } else if (Math.abs(x - prevX) >= minDist * 2) {
          break;
        }
      }
      (item as any)._level = level;
      const side = level % 2 === 0 ? 'above' : 'below';
      const offset = Math.floor(level / 2) * (CARD_H + CONNECTOR_H + 12);
      return { ...item, x, side, offset };
    });
  }, [sorted, scale, minYear]);

  // Year markers
  const markers = useMemo(() => {
    const m: number[] = [];
    const start = Math.floor(minYear / MARKER_INTERVAL) * MARKER_INTERVAL;
    const end = Math.ceil(maxYear / MARKER_INTERVAL) * MARKER_INTERVAL;
    for (let y = start; y <= end; y += MARKER_INTERVAL) {
      m.push(y);
    }
    return m;
  }, [minYear, maxYear]);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    setScale((s) => {
      const next = s - (e.deltaY > 0 ? 0.08 : -0.08);
      return Math.min(MAX_SCALE, Math.max(MIN_SCALE, next));
    });
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button')) return;
    setDragging(true);
    hasDragged.current = false;
    dragStart.current = { x: e.clientX, tx: translateX };
  }, [translateX]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!dragging) return;
    const dx = e.clientX - dragStart.current.x;
    if (Math.abs(dx) > 3) hasDragged.current = true;
    setTranslateX(dragStart.current.tx + dx);
  }, [dragging]);

  const handleMouseUp = useCallback(() => {
    setDragging(false);
  }, []);

  const handleCardClick = useCallback((id: string) => {
    if (hasDragged.current) return;
    onSelect(id);
  }, [onSelect]);

  return (
    <div className="relative h-full flex flex-col">
      {/* Zoom controls */}
      <div className="absolute top-3 right-4 z-20 flex items-center gap-1.5">
        <button
          onClick={() => setScale((s) => Math.min(MAX_SCALE, s + 0.15))}
          className="w-6 h-6 flex items-center justify-center rounded-full bg-white/[0.06] hover:bg-white/[0.12] text-white/50 hover:text-white/80 text-xs transition-colors"
        >
          +
        </button>
        <button
          onClick={() => setScale((s) => Math.max(MIN_SCALE, s - 0.15))}
          className="w-6 h-6 flex items-center justify-center rounded-full bg-white/[0.06] hover:bg-white/[0.12] text-white/50 hover:text-white/80 text-xs transition-colors"
        >
          −
        </button>
        <span className="text-[10px] text-white/25 ml-1 w-9 text-center">{Math.round(scale * 100)}%</span>
      </div>

      {/* Scrollable timeline area */}
      <div
        ref={containerRef}
        className={`flex-1 overflow-hidden select-none ${dragging ? 'cursor-grabbing' : 'cursor-grab'}`}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <div
          className="relative h-full"
          style={{
            width: totalWidth,
            minWidth: '100%',
            transform: `translateX(${translateX}px)`,
            transition: dragging ? 'none' : 'transform 0.12s ease-out',
          }}
        >
          {/* Central timeline axis */}
          <div
            className="absolute left-0 right-0"
            style={{ top: '50%', height: 1, background: 'rgba(255,255,255,0.18)' }}
          />

          {/* Year markers */}
          {markers.map((y) => {
            const x = xForYear(y);
            return (
              <div
                key={y}
                className="absolute -translate-x-1/2"
                style={{ left: x, top: '50%' }}
              >
                <div style={{ width: 1, height: 12, background: 'rgba(255,255,255,0.3)', margin: '0 auto' }} />
                <span
                  className="block text-center whitespace-nowrap mt-1.5"
                  style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', letterSpacing: '0.05em' }}
                >
                  {formatYear(y)}
                </span>
              </div>
            );
          })}

          {/* Cards */}
          {layout.map(({ node, regionName, x, side, offset }) => {
            const isAbove = side === 'above';
            const topFromCenter = CONNECTOR_H + offset;

            return (
              <div
                key={node.id}
                className="absolute"
                style={{
                  left: x - CARD_W / 2,
                  width: CARD_W,
                  height: CARD_H,
                  top: isAbove
                    ? `calc(50% - ${CARD_H}px - ${topFromCenter}px)`
                    : `calc(50% + ${topFromCenter}px)`,
                }}
              >
                {/* Connector line */}
                <div
                  style={{
                    position: 'absolute',
                    left: '50%',
                    width: 1,
                    background: 'rgba(255,255,255,0.14)',
                    ...(isAbove
                      ? { top: CARD_H, height: topFromCenter }
                      : { bottom: CARD_H, height: topFromCenter }),
                  }}
                />
                {/* Connector dot on axis */}
                <div
                  style={{
                    position: 'absolute',
                    left: '50%',
                    marginLeft: -2.5,
                    width: 5,
                    height: 5,
                    borderRadius: '50%',
                    background: selectedId === node.id
                      ? 'rgba(255,255,255,0.7)'
                      : 'rgba(255,255,255,0.35)',
                    ...(isAbove ? { top: CARD_H + topFromCenter - 2.5 } : { bottom: CARD_H + topFromCenter - 2.5 }),
                  }}
                />

                <TimelineCard
                  node={node}
                  regionName={regionName}
                  isSelected={selectedId === node.id}
                  isHighlighted={highlightedIds.has(node.id)}
                  onClick={() => handleCardClick(node.id)}
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
