import type { DynastyNode } from '../types';

interface Props {
  node: DynastyNode;
  isSelected: boolean;
  isHighlighted: boolean;
  onClick: () => void;
  regionName?: string;
}

export default function TimelineCard({ node, isSelected, isHighlighted, onClick, regionName }: Props) {
  return (
    <button
      data-snap
      onClick={onClick}
      className={`
        block w-full h-full rounded-lg text-left
        backdrop-blur-sm transition-all duration-300
        border overflow-hidden
        ${isSelected
          ? 'bg-white/8 border-white/25 shadow-lg shadow-white/6'
          : isHighlighted
          ? 'bg-white/6 border-white/18'
          : 'bg-white/[0.03] border-white/[0.08] hover:bg-white/[0.05] hover:border-white/[0.14]'
        }
      `}
    >
      <div className="flex flex-col h-full px-3 py-2.5">
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
