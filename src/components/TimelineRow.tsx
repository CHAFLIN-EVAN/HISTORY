import type { DynastyNode } from '../types';
import TimelineCard from './TimelineCard';

interface Props {
  section: DynastyNode;
  selectedId: string | null;
  highlightedIds: Set<string>;
  onSelect: (id: string) => void;
}

export default function TimelineRow({ section, selectedId, highlightedIds, onSelect }: Props) {
  const cards = section.children || [];

  return (
    <div className="mb-10">
      {/* Section label */}
      <div className="flex items-center gap-3 mb-4 px-2">
        <span className="w-1 h-1 rounded-full bg-white/30" />
        <h2 className="text-xs tracking-[0.4em] text-white/40 uppercase font-medium">
          {section.name}
        </h2>
        <span className="text-[10px] text-white/20">{section.nameEn}</span>
      </div>

      {/* Timeline row */}
      <div className="relative">
        {/* Horizontal line */}
        <div className="absolute top-1/2 -translate-y-1/2 left-0 right-0 h-[0.5px] bg-white/[0.06]" />

        {/* Cards */}
        <div className="flex gap-3 overflow-x-auto px-2 pb-6 content-scroll">
          {cards.map((card) => (
            <TimelineCard
              key={card.id}
              node={card}
              isSelected={selectedId === card.id}
              isHighlighted={highlightedIds.has(card.id)}
              onClick={() => onSelect(card.id)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
