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
const SCALE_STEP = 0.08;

export default function UnifiedTimeline({ nodes, selectedId, highlightedIds, onSelect }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [translateX, setTranslateX] = useState(0);
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef({ x: 0, tx: 0 });
  const hasDragged = useRef(false);

  const sorted = useMemo(() => {
    return [...nodes].sort((a, b) => {
      const sa = parsePeriodStart(a.node.period);
      const sb = parsePeriodStart(b.node.period);
      return sa - sb;
    });
  }, [nodes]);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    setScale((s) => {
      const next = s - (e.deltaY > 0 ? SCALE_STEP : -SCALE_STEP);
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

  // Generate time markers
  const timeMarkers = useMemo(() => {
    const markers: { year: number; label: string }[] = [];
    for (let y = -3000; y <= 2000; y += 500) {
      markers.push({
        year: y,
        label: y < 0 ? `前${-y}` : y === 0 ? '公元元年' : `${y}`,
      });
    }
    return markers;
  }, []);

  const allYears = useMemo(() => {
    return sorted.map((s) => parsePeriodStart(s.node.period)).filter((y) => isFinite(y));
  }, [sorted]);

  const minYear = allYears.length > 0 ? Math.min(...allYears) : -3000;
  const maxYear = allYears.length > 0 ? Math.max(...allYears) : 2000;
  const yearRange = maxYear - minYear;

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

      {/* Timeline container */}
      <div
        ref={containerRef}
        className={`flex-1 overflow-hidden ${dragging ? 'cursor-grabbing' : 'cursor-grab'}`}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <div
          className="relative h-full"
          style={{
            transform: `translateX(${translateX}px) scale(${scale})`,
            transformOrigin: 'center center',
            transition: dragging ? 'none' : 'transform 0.15s ease-out',
          }}
        >
          {/* Cards row */}
          <div className="absolute top-1/2 -translate-y-1/2 flex items-center gap-3 px-[50vw]">
            {sorted.map(({ node, regionName }) => (
              <TimelineCard
                key={node.id}
                node={node}
                regionName={regionName}
                isSelected={selectedId === node.id}
                isHighlighted={highlightedIds.has(node.id)}
                onClick={() => handleCardClick(node.id)}
              />
            ))}
          </div>

          {/* Time axis line */}
          <div className="absolute bottom-10 left-0 right-0 h-[0.5px] bg-white/6" />

          {/* Time markers */}
          <div className="absolute bottom-6 left-0 right-0 flex">
            {timeMarkers.map((m) => {
              const pos = ((m.year - minYear) / yearRange) * 100;
              return (
                <div
                  key={m.year}
                  className="absolute -translate-x-1/2"
                  style={{ left: `${pos}%` }}
                >
                  <div className="w-[0.5px] h-2 bg-white/8 mx-auto" />
                  <span className="text-[9px] text-white/20 block mt-1 text-center whitespace-nowrap">
                    {m.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
