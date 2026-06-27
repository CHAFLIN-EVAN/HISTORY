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
        background: isSelected ? '#FFFFFF' : '#FCFBF8',
        border: isSelected
          ? `1.5px solid ${accentColor}`
          : isHighlighted
          ? '1px solid rgba(0,0,0,0.12)'
          : '1px solid rgba(0,0,0,0.06)',
        boxShadow: isSelected
          ? '0 4px 24px rgba(0,0,0,0.08)'
          : hovering
          ? '0 2px 16px rgba(0,0,0,0.06)'
          : '0 1px 4px rgba(0,0,0,0.03)',
        transform: `perspective(600px) rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg)`,
        transformStyle: 'preserve-3d',
        transition: hovering ? 'none' : 'transform 0.4s ease-out, box-shadow 0.3s, border-color 0.3s',
      }}
    >
      {/* Folder tab — colored accent bar at top */}
      <div
        className="h-[3px] w-full"
        style={{ background: isSelected ? accentColor : 'rgba(0,0,0,0.06)' }}
      />

      <div className="flex flex-col px-3 py-2.5">
        {/* Period */}
        {node.period && (
          <span className="text-[9px] tracking-widest uppercase leading-none mb-1" style={{ color: '#B8B2A8' }}>
            {node.period}
          </span>
        )}

        {/* Region + name */}
        <div className="flex-1 flex flex-col justify-center">
          {regionName && (
            <span className="text-[8px] leading-none mb-0.5" style={{ color: accentColor }}>
              {regionName}
            </span>
          )}
          <h3 className="text-[11px] font-medium leading-tight truncate" style={{ color: isSelected ? '#2D2B28' : '#4A4742' }}>
            {node.name}
          </h3>
          {node.nameEn && (
            <p className="text-[9px] leading-tight mt-0.5 truncate" style={{ color: '#B8B2A8' }}>{node.nameEn}</p>
          )}
        </div>
      </div>
    </button>
  );
}
