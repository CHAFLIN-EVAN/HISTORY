import type { HistoricalFigure } from '../types';

interface Props {
  figures: HistoricalFigure[];
  dark?: boolean;
}

export default function FiguresView({ figures, dark }: Props) {
  const cardBg = dark ? 'bg-white/[0.03] border-white/[0.06]' : 'bg-white border-zinc-200/60';
  const cardHover = dark ? 'hover:bg-white/[0.06]' : 'hover:border-zinc-300 hover:shadow-md';
  const nameColor = dark ? 'text-white/80' : 'text-zinc-800';
  const titleColor = dark ? 'text-white/30' : 'text-zinc-400';
  const descColor = dark ? 'text-white/50' : 'text-zinc-500';
  const avatarBg = dark ? 'bg-white/10 text-white/50' : 'bg-zinc-100 text-zinc-500';

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {figures.map((f, i) => (
        <div
          key={i}
          className={`rounded-xl p-4 border transition-all duration-200 ${cardBg} ${cardHover}`}
        >
          <div className="flex items-start gap-3">
            <div className={`w-9 h-9 rounded-full flex items-center justify-center font-medium text-xs flex-shrink-0 ${avatarBg}`}>
              {f.name.charAt(0)}
            </div>
            <div className="min-w-0">
              <h4 className={`text-sm font-medium ${nameColor}`}>{f.name}</h4>
              <p className={`text-[11px] mt-0.5 ${titleColor}`}>{f.title}</p>
              <p className={`text-[13px] mt-2 leading-relaxed ${descColor}`}>{f.description}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
