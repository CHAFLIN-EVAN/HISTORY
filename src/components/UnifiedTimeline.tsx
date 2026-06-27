import { useState, useRef, useCallback, useMemo } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import type { DynastyNode } from '../types';
import { parsePeriodStart } from '../utils/period';
import TimelineCard from './TimelineCard';

gsap.registerPlugin(useGSAP);

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
const PADDING_X = 200;
const MIN_CARD_GAP = 48;

function formatYear(y: number): string {
  if (y < 0) return `前${-y}`;
  if (y === 0) return '公元元年';
  return `${y}`;
}

/** Compress large year gaps so empty periods don't waste space */
function gapPx(yearGap: number, scale: number): number {
  const raw = yearGap * BASE_PX_PER_YEAR * scale;
  const maxGap = 320 * scale;
  return maxGap * (raw / (raw + maxGap));
}

/** Node weight: nodes with more children get extra breathing room */
function nodeWeight(node: DynastyNode): number {
  const childCount = node.children?.length || 0;
  if (childCount === 0) return 1;
  if (childCount <= 3) return 1.2;
  if (childCount <= 6) return 1.4;
  return 1.6;
}

export default function UnifiedTimeline({ nodes, selectedId, highlightedIds, onSelect }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.6);
  const [translateX, setTranslateX] = useState(0);
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef({ x: 0, tx: 0 });
  const hasDragged = useRef(false);

  const sorted = useMemo(() => {
    return [...nodes]
      .map((item) => ({ ...item, year: parsePeriodStart(item.node.period) }))
      .filter((item) => isFinite(item.year))
      .sort((a, b) => a.year - b.year);
  }, [nodes]);

  // Non-linear positions — compress empty periods
  const layout = useMemo(() => {
    // First pass: assign X positions with gap compression
    const withPositions: { x: number }[] = [];
    let currentX = PADDING_X;

    for (let i = 0; i < sorted.length; i++) {
      withPositions.push({ x: currentX });

      if (i < sorted.length - 1) {
        const yearGap = Math.max(0, sorted[i + 1].year - sorted[i].year);
        const pxGap = gapPx(yearGap, scale);
        const w = nodeWeight(sorted[i].node);
        currentX += Math.max(MIN_CARD_GAP, pxGap) * w;
      }
    }

    const totalW = currentX + PADDING_X;

    // Second pass: stagger overlapping cards
    return sorted.map((item, i) => {
      const x = withPositions[i].x;
      let level = 0;
      const minDist = (CARD_W + 20) / scale;

      for (let j = i - 1; j >= 0 && j >= i - 6; j--) {
        const prevX = withPositions[j].x;
        if (Math.abs(x - prevX) < minDist && (sorted[j] as any)._level === level) {
          level++;
        } else if (Math.abs(x - prevX) >= minDist * 2) {
          break;
        }
      }
      (item as any)._level = level;
      const side = level % 2 === 0 ? 'above' : 'below';
      const rawOffset = Math.floor(level / 2) * 100;
      const offset = Math.min(rawOffset, 160); // Cap to prevent overlap with news section
      return { ...item, x, side, offset, totalWidth: totalW };
    });
  }, [sorted, scale]);

  const totalWidth = layout.length > 0 ? layout[0].totalWidth : 10000;

  // Stagger card entrance
  useGSAP(() => {
    gsap.fromTo('.timeline-card-wrap',
      { autoAlpha: 0, y: 20, scale: 0.95 },
      { autoAlpha: 1, y: 0, scale: 1, duration: 0.5, stagger: { each: 0.02, from: 'start' }, ease: 'power2.out' }
    );
  }, { dependencies: [sorted.length] });

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
          className="w-6 h-6 flex items-center justify-center rounded-full text-xs transition-colors"
          style={{ background: 'rgba(0,0,0,0.04)', color: '#8A8680' }}
        >
          +
        </button>
        <button
          onClick={() => setScale((s) => Math.max(MIN_SCALE, s - 0.15))}
          className="w-6 h-6 flex items-center justify-center rounded-full text-xs transition-colors"
          style={{ background: 'rgba(0,0,0,0.04)', color: '#8A8680' }}
        >
          −
        </button>
        <span className="text-[10px] ml-1 w-9 text-center" style={{ color: '#C8C3B8' }}>{Math.round(scale * 100)}%</span>
      </div>

      {/* Fixed central axis */}
      <div
        className="absolute left-0 right-0 z-10 pointer-events-none"
        style={{ top: '50%', height: 1, background: 'rgba(0,0,0,0.08)' }}
      />

      {/* Scrollable layer — overflow:clip with margin prevents card clipping */}
      <div
        ref={containerRef}
        className={`flex-1 select-none overflow-hidden ${dragging ? 'cursor-grabbing' : 'cursor-grab'}`}
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
          {/* Cards */}
          {layout.map(({ node, regionName, year, x, side, offset }) => {
            const isAbove = side === 'above';
            const topFromCenter = CONNECTOR_H + offset;
            const axisY = '50%';

            return (
              <div
                key={node.id}
                className="timeline-card-wrap absolute"
                style={{ visibility: 'hidden',
                  left: x - CARD_W / 2,
                  width: CARD_W,
                  height: CARD_H,
                  top: isAbove
                    ? `calc(${axisY} - ${CARD_H}px - ${topFromCenter}px)`
                    : `calc(${axisY} + ${topFromCenter}px)`,
                }}
              >
                {/* Connector line */}
                <div
                  style={{
                    position: 'absolute',
                    left: '50%',
                    width: 1,
                    background: 'rgba(0,0,0,0.08)',
                    ...(isAbove
                      ? { top: CARD_H, height: topFromCenter }
                      : { bottom: CARD_H, height: topFromCenter }),
                  }}
                />
                {/* Connector dot */}
                <div
                  style={{
                    position: 'absolute',
                    left: '50%',
                    marginLeft: -3,
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    background: selectedId === node.id
                      ? 'rgba(0,0,0,0.5)'
                      : 'rgba(0,0,0,0.2)',
                    ...(isAbove
                      ? { top: CARD_H + topFromCenter - 3 }
                      : { bottom: CARD_H + topFromCenter - 3 }),
                  }}
                />

                {/* Year label */}
                <span
                  className="absolute left-1/2 -translate-x-1/2 whitespace-nowrap text-[9px] tracking-wider"
                  style={{
                    color: '#C8C3B8',
                    ...(isAbove
                      ? { top: CARD_H + topFromCenter + 8 }
                      : { bottom: CARD_H + topFromCenter + 8 }),
                  }}
                >
                  {formatYear(year)}
                </span>

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
