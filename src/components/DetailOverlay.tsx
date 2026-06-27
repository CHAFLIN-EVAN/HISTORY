import { useState, useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import type { DynastyNode } from '../types';
import TimelineView from './TimelineView';
import RelationGraph from './RelationGraph';

gsap.registerPlugin(useGSAP);

interface Props {
  node: DynastyNode;
  onClose: () => void;
  onNavigate: (id: string) => void;
}

export default function DetailOverlay({ node, onClose, onNavigate }: Props) {
  const [tab, setTab] = useState<'overview' | 'timeline' | 'figures' | 'culture'>('overview');
  const backdropRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const exitingRef = useRef(false);

  useGSAP(() => {
    if (exitingRef.current) return;

    const tl = gsap.timeline();

    tl.fromTo(backdropRef.current,
      { autoAlpha: 0 },
      { autoAlpha: 1, duration: 0.3, ease: 'power2.out' }
    );

    tl.fromTo(panelRef.current,
      { autoAlpha: 0, scale: 0.95, y: 20 },
      { autoAlpha: 1, scale: 1, y: 0, duration: 0.35, ease: 'power3.out' },
      '<0.05'
    );

    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') handleClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [node.id]);

  function handleClose() {
    exitingRef.current = true;

    const tl = gsap.timeline({
      onComplete: () => onClose(),
    });

    tl.to(panelRef.current,
      { autoAlpha: 0, scale: 0.95, y: 10, duration: 0.25, ease: 'power2.in' }
    );

    tl.to(backdropRef.current,
      { autoAlpha: 0, duration: 0.2, ease: 'power2.in' },
      '<0.05'
    );
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
        ref={backdropRef}
        className="fixed inset-0 z-40"
        style={{ visibility: 'hidden', background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(4px)' }}
        onClick={handleClose}
      />

      {/* Panel */}
      <div
        ref={panelRef}
        className="fixed z-50
          inset-8 sm:inset-12 md:inset-16 lg:inset-x-24 lg:inset-y-16
          rounded-3xl border
          shadow-2xl
          flex flex-col overflow-hidden"
        style={{
          visibility: 'hidden',
          background: 'rgba(255,255,255,0.92)',
          backdropFilter: 'blur(20px)',
          borderColor: 'rgba(0,0,0,0.08)',
          boxShadow: '0 24px 80px rgba(0,0,0,0.12)',
        }}
      >
        {/* Header bar */}
        <div className="flex-shrink-0 flex items-center justify-between px-8 py-5 border-b" style={{ borderColor: 'rgba(0,0,0,0.06)' }}>
          <div className="flex items-center gap-3 min-w-0">
            <h2 className="text-base font-semibold tracking-wide truncate" style={{ color: '#3D3A35' }}>{node.name}</h2>
            {node.period && (
              <span className="text-[11px] tracking-wider px-2.5 py-0.5 rounded-full flex-shrink-0" style={{ color: '#8A8680', background: 'rgba(0,0,0,0.04)' }}>
                {node.period}
              </span>
            )}
          </div>
          <button
            onClick={handleClose}
            className="flex-shrink-0 p-2 transition-colors rounded-lg"
            style={{ color: '#B8B2A8' }}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto content-scroll">
          <div className="px-8 py-6">
            {children.length > 0 && (
              <div className="flex gap-2 flex-wrap mb-6">
                {children.map((ch) => (
                  <button
                    key={ch.id}
                    data-snap
                    onClick={() => onNavigate(ch.id)}
                    className="px-3 py-1.5 rounded-lg text-xs transition-all"
                    style={{ color: '#5C5852', background: 'rgba(0,0,0,0.03)', border: '1px solid rgba(0,0,0,0.06)' }}
                  >
                    {ch.name}
                  </button>
                ))}
              </div>
            )}

            {hasContent && (
              <>
                <div className="flex gap-5 mb-5 border-b" style={{ borderColor: 'rgba(0,0,0,0.06)' }}>
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
                          tab === t ? 'font-medium' : ''
                        }`}
                        style={{ color: tab === t ? '#3D3A35' : '#B8B2A8' }}
                      >
                        {labels[t]}
                        {tab === t && (
                          <span className="absolute bottom-0 left-0 right-0" style={{ height: 1, background: 'rgba(0,0,0,0.2)' }} />
                        )}
                      </button>
                    );
                  })}
                </div>

                {tab === 'overview' && (
                  <p className="text-sm leading-relaxed" style={{ color: '#6B6762' }}>{c.overview}</p>
                )}
                {tab === 'timeline' && hasTimeline && (
                  <TimelineView events={c.timeline} dark={false} />
                )}
                {tab === 'figures' && hasFigures && (
                  <RelationGraph figures={c.figures} />
                )}
                {tab === 'culture' && hasCulture && (
                  <p className="text-sm leading-relaxed" style={{ color: '#6B6762' }}>{c.culture}</p>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
