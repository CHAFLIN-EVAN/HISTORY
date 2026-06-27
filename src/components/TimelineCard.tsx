import { useState, useCallback, type MouseEvent } from 'react';
import type { DynastyNode } from '../types';

interface Props {
  node: DynastyNode;
  isSelected: boolean;
  isHighlighted: boolean;
  onClick: () => void;
  regionName?: string;
}

export default function TimelineCard({ node, isSelected, isHighlighted, onClick, regionName }: Props) {
  const [tilt, setTilt] = useState({ rx: 0, ry: 0 });
  const [hovering, setHovering] = useState(false);

  const handleMove = useCallback((e: MouseEvent) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = (e.clientX - cx) / (rect.width / 2);
    const dy = (e.clientY - cy) / (rect.height / 2);
    setTilt({ rx: -dy * 8, ry: dx * 8 });
  }, []);

  const handleEnter = useCallback(() => setHovering(true), []);
  const handleLeave = useCallback(() => {
    setHovering(false);
    setTilt({ rx: 0, ry: 0 });
  }, []);

  return (
    <button
      data-snap
      onClick={onClick}
      onMouseMove={handleMove}
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
      className={`
        block w-full h-full rounded-lg text-left
        backdrop-blur-sm transition-colors duration-300
        border overflow-hidden
        ${isSelected
          ? 'bg-white/8 border-white/25 shadow-lg shadow-white/6'
          : isHighlighted
          ? 'bg-white/6 border-white/18'
          : 'bg-white/[0.03] border-white/[0.08] hover:bg-white/[0.05] hover:border-white/[0.14]'
        }
      `}
      style={{
        transform: `perspective(600px) rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg)`,
        transformStyle: 'preserve-3d',
        transition: hovering ? 'none' : 'transform 0.4s ease-out',
      }}
    >
      {/* Glossy highlight that follows tilt */}
      <div
        className="absolute inset-0 rounded-lg pointer-events-none"
        style={{
          background: hovering
            ? `radial-gradient(circle at ${50 + tilt.ry * 3}% ${50 + tilt.rx * 3}%, rgba(255,255,255,0.07) 0%, transparent 60%)`
            : 'none',
          transition: hovering ? 'none' : 'opacity 0.4s',
        }}
      />

      <div className="flex flex-col h-full px-3 py-2.5 relative">
        {/* Period */}
        {node.period && (
          <span className="text-[9px] tracking-widest text-white/40 uppercase leading-none mb-1">
            {node.period}
          </span>
        )}

        {/* Region + name row */}
        <div className="flex-1 flex flex-col justify-center">
          {regionName && (
            <span className="text-[8px] text-white/20 leading-none mb-0.5">{regionName}</span>
          )}
          <h3 className={`text-[11px] font-medium leading-tight truncate ${
            isSelected ? 'text-white' : 'text-white/80'
          }`}>
            {node.name}
          </h3>
          {node.nameEn && (
            <p className="text-[9px] text-white/30 leading-tight mt-0.5 truncate">{node.nameEn}</p>
          )}
        </div>
      </div>
    </button>
  );
}
