import { useState, useEffect } from 'react';
import type { DynastyNode } from '../types';
import TimelineView from './TimelineView';
import RelationGraph from './RelationGraph';

interface Props {
  node: DynastyNode;
  onClose: () => void;
  onNavigate: (id: string) => void;
}

export default function DetailOverlay({ node, onClose, onNavigate }: Props) {
  const [tab, setTab] = useState<'overview' | 'timeline' | 'figures' | 'culture'>('overview');
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setTab('overview');
    requestAnimationFrame(() => setVisible(true));
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') handleClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [node.id]);

  function handleClose() {
    setVisible(false);
    setTimeout(onClose, 350);
  }

  const c = node.content;
  const hasContent = !!c;
  const children = node.children || [];
  const hasFigures = !!(c?.figures && c.figures.length > 0);
  const hasTimeline = !!(c?.timeline && c.timeline.length > 0);
  const hasCulture = !!c?.culture;

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity duration-300 ${
          visible ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={handleClose}
      />

      {/* Centered glass panel */}
      <div
        className={`fixed z-50 transition-all duration-300
          inset-8 sm:inset-12 md:inset-16 lg:inset-x-24 lg:inset-y-16
          rounded-3xl border border-white/[0.10]
          bg-zinc-900/75 backdrop-blur-2xl
          shadow-2xl shadow-black/40
          flex flex-col overflow-hidden
          ${visible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}
      >
        {/* Header bar */}
        <div className="flex-shrink-0 flex items-center justify-between px-8 py-5 border-b border-white/[0.06]">
          <div className="flex items-center gap-3 min-w-0">
            <h2 className="text-base font-semibold text-white/90 tracking-wide truncate">{node.name}</h2>
            {node.period && (
              <span className="text-[11px] tracking-wider text-white/30 bg-white/[0.05] px-2.5 py-0.5 rounded-full flex-shrink-0">
                {node.period}
              </span>
            )}
          </div>
          <button
            onClick={handleClose}
            className="flex-shrink-0 p-2 text-white/25 hover:text-white/60 transition-colors rounded-lg hover:bg-white/[0.05]"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto content-scroll">
          <div className="px-8 py-6">
            {/* Sub-children chips */}
            {children.length > 0 && (
              <div className="flex gap-2 flex-wrap mb-6">
                {children.map((ch) => (
                  <button
                    key={ch.id}
                    data-snap
                    onClick={() => onNavigate(ch.id)}
                    className="px-3 py-1.5 rounded-lg text-xs text-white/70 bg-white/[0.06] border border-white/[0.10]
                             hover:bg-white/[0.12] hover:text-white/90 transition-all"
                  >
                    {ch.name}
                  </button>
                ))}
              </div>
            )}

            {/* Tabs */}
            {hasContent && (
              <>
                <div className="flex gap-5 mb-5 border-b border-white/[0.06]">
                  {(['overview', 'timeline', 'figures', 'culture'] as const).map((t) => {
                    const labels = { overview: '概述', timeline: '时间线', figures: '人物', culture: '文化' };
                    const empty = (t === 'timeline' && !hasTimeline) ||
                                  (t === 'figures' && !hasFigures) ||
                                  (t === 'culture' && !hasCulture);
                    if (empty) return null;
                    return (
                      <button
                        key={t}
                        onClick={() => setTab(t)}
                        className={`pb-2.5 text-xs transition-colors relative ${
                          tab === t ? 'text-white font-medium' : 'text-white/30 hover:text-white/50'
                        }`}
                      >
                        {labels[t]}
                        {tab === t && <span className="absolute bottom-0 left-0 right-0 h-[1px] bg-white/40" />}
                      </button>
                    );
                  })}
                </div>

                {/* Content */}
                {tab === 'overview' && (
                  <p className="text-sm leading-relaxed text-white/65">{c.overview}</p>
                )}
                {tab === 'timeline' && hasTimeline && (
                  <TimelineView events={c.timeline} dark />
                )}
                {tab === 'figures' && hasFigures && (
                  <RelationGraph figures={c.figures} />
                )}
                {tab === 'culture' && hasCulture && (
                  <p className="text-sm leading-relaxed text-white/65">{c.culture}</p>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
