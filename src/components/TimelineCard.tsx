import type { DynastyNode } from '../types';

interface Props {
  node: DynastyNode;
  isSelected: boolean;
  isHighlighted: boolean;
  onClick: () => void;
  regionName?: string;
}

export default function TimelineCard({ node, isSelected, isHighlighted, onClick, regionName }: Props) {
  const hasChildren = !!(node.children && node.children.length > 0);

  return (
    <button
      data-snap
      onClick={onClick}
      className={`
        group relative flex-shrink-0 w-44 px-4 py-4 rounded-xl text-left
        backdrop-blur-sm transition-all duration-300
        border
        ${isSelected
          ? 'bg-white/14 border-white/35 shadow-lg shadow-white/8 scale-105'
          : isHighlighted
          ? 'bg-white/10 border-white/25'
          : 'bg-white/[0.07] border-white/[0.12] hover:bg-white/[0.10] hover:border-white/[0.22]'
        }
      `}
    >
      {/* Timeline dot connector */}
      <div className={`absolute -bottom-2 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full transition-colors ${
        isSelected ? 'bg-white' : 'bg-white/40 group-hover:bg-white/70'
      }`} />

      {/* Period */}
      {node.period && (
        <span className="text-[10px] tracking-widest text-white/50 uppercase mb-2 block">
          {node.period}
        </span>
      )}

      {/* Region badge */}
      {regionName && (
        <span className="text-[9px] text-white/25 mb-0.5 block">{regionName}</span>
      )}

      {/* Name */}
      <h3 className={`text-sm font-medium tracking-wide transition-colors ${
        isSelected ? 'text-white' : 'text-white/90 group-hover:text-white'
      }`}>
        {node.name}
      </h3>

      {/* English name */}
      {node.nameEn && (
        <p className="text-[10px] text-white/40 mt-0.5 truncate">{node.nameEn}</p>
      )}

      {/* Children count */}
      {hasChildren && (
        <span className="absolute top-3 right-3 text-white/30 text-[10px]">
          {node.children!.length}
        </span>
      )}

      {/* Selected indicator */}
      {isSelected && (
        <div className="absolute bottom-0 left-4 right-4 h-[1px] bg-gradient-to-r from-transparent via-white/70 to-transparent" />
      )}
    </button>
  );
}
