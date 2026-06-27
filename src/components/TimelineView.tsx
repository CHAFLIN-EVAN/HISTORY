import type { TimelineEvent } from '../types';

interface Props {
  events: TimelineEvent[];
  dark?: boolean;
}

export default function TimelineView({ events, dark }: Props) {
  const lineColor = dark ? 'bg-white/[0.08]' : 'bg-zinc-200';
  const dotBorder = dark ? 'border-white/20' : 'border-zinc-300';
  const dotBg = dark ? 'bg-zinc-900' : 'bg-white';
  const cardBg = dark ? 'bg-white/[0.03] border-white/[0.06]' : 'bg-white border-zinc-200/60';
  const cardHover = dark ? 'hover:bg-white/[0.06]' : 'hover:border-zinc-300';
  const yearColor = dark ? 'text-white/30' : 'text-zinc-400';
  const textColor = dark ? 'text-white/70' : 'text-zinc-700';

  return (
    <div className="relative">
      <div className={`absolute left-[5px] top-2 bottom-2 w-px ${lineColor}`} />

      <div className="space-y-3">
        {events.map((e, i) => (
          <div key={i} className="flex gap-4 pl-0">
            <div className="relative z-10 mt-[7px]">
              <div className={`w-2.5 h-2.5 rounded-full border-2 ${dotBorder} ${dotBg}`} />
            </div>
            <div className={`flex-1 rounded-lg px-4 py-3 border shadow-sm transition-colors ${cardBg} ${cardHover}`}>
              <div className={`text-[11px] font-medium mb-1 tracking-wide ${yearColor}`}>{e.year}</div>
              <div className={`text-sm leading-relaxed ${textColor}`}>{e.event}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
