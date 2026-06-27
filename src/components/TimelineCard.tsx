import { useState, useCallback, type MouseEvent } from 'react';
import type { DynastyNode } from '../types';

interface Props {
  node: DynastyNode;
  isSelected: boolean;
  isHighlighted: boolean;
  onClick: () => void;
  regionName?: string;
}

const REGION_COLORS: Record<string, string> = {
  '中国': '#B8944E',
  '日本': '#C4645A',
  '欧洲': '#5A8F7B',
  '中东': '#7B6BA3',
};

export default function TimelineCard({ node, isSelected, isHighlighted, onClick, regionName }: Props) {
  const [tilt, setTilt] = useState({ rx: 0, ry: 0 });
  const [hovering, setHovering] = useState(false);

  const handleMove = useCallback((e: MouseEvent) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = (e.clientX - cx) / (rect.width / 2);
    const dy = (e.clientY - cy) / (rect.height / 2);
    setTilt({ rx: -dy * 6, ry: dx * 6 });
  }, []);

  const handleEnter = useCallback(() => setHovering(true), []);
  const handleLeave = useCallback(() => {
    setHovering(false);
    setTilt({ rx: 0, ry: 0 });
  }, []);

  const accentColor = REGION_COLORS[regionName || ''] || '#B8944E';

  return (
    <button
      data-snap
      onClick={onClick}
      onMouseMove={handleMove}
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
      className="block w-full h-full rounded-lg text-left transition-colors duration-300 overflow-hidden"
      style={{
        background: isSelected
          ? 'rgba(255,255,255,0.08)'
          : 'rgba(255,255,255,0.02)',
        border: isSelected
          ? `1px solid rgba(255,255,255,0.2)`
          : isHighlighted
          ? '1px solid rgba(255,255,255,0.1)'
          : '1px solid rgba(255,255,255,0.04)',
        boxShadow: isSelected
          ? `0 0 30px ${accentColor}20, 0 4px 20px rgba(0,0,0,0.3)`
          : hovering
          ? '0 0 20px rgba(255,255,255,0.04), 0 2px 12px rgba(0,0,0,0.2)'
          : '0 1px 3px rgba(0,0,0,0.2)',
        transform: `perspective(600px) rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg)`,
        transformStyle: 'preserve-3d',
        transition: hovering ? 'none' : 'transform 0.4s ease-out, box-shadow 0.3s, border-color 0.3s',
      }}
    >
      {/* Accent bar at top */}
      <div
        className="h-[2px] w-full"
        style={{ background: isSelected ? accentColor : 'rgba(255,255,255,0.04)' }}
      />

      <div className="flex flex-col px-3 py-2.5">
        {/* Period */}
        {node.period && (
          <span className="text-[9px] tracking-[0.15em] uppercase leading-none mb-1" style={{ color: 'rgba(255,255,255,0.2)' }}>
            {node.period}
          </span>
        )}

        {/* Region + name */}
        <div className="flex-1 flex flex-col justify-center">
          {regionName && (
            <span className="text-[8px] leading-none mb-0.5" style={{ color: accentColor, opacity: 0.7 }}>
              {regionName}
            </span>
          )}
          <h3 className="text-[11px] font-light leading-tight truncate tracking-wide" style={{ color: isSelected ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.6)' }}>
            {node.name}
          </h3>
          {node.nameEn && (
            <p className="text-[9px] leading-tight mt-0.5 truncate" style={{ color: 'rgba(255,255,255,0.15)' }}>{node.nameEn}</p>
          )}
        </div>
      </div>
    </button>
  );
}
