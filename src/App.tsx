import { useState, useCallback, useMemo } from 'react';
import type { DynastyNode } from './types';
import { historyTree, findNodeById, flattenTree } from './data';
import { useSearch } from './hooks/useSearch';
import { useUserData } from './hooks/useUserData';
import Starfield from './components/Starfield';
import ArchiveParticles from './components/ArchiveParticles';
import CustomCursor from './components/CustomCursor';
import SplashScreen from './components/SplashScreen';
import UnifiedTimeline from './components/UnifiedTimeline';
import DetailOverlay from './components/DetailOverlay';
import NewsCards from './components/NewsCards';

/** Collect all displayable nodes from a subtree, tagged with region name */
function collectNodes(node: DynastyNode, regionName: string): { node: DynastyNode; regionName: string }[] {
  const results: { node: typeof node; regionName: string }[] = [];
  if (node.content || (node.children && node.children.length > 0)) {
    results.push({ node, regionName });
  }
  if (node.children) {
    for (const child of node.children) {
      results.push(...collectNodes(child, regionName));
    }
  }
  return results;
}

export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { query, setQuery, clearSearch } = useSearch(historyTree);

  useUserData();

  const highlightedIds = useMemo(() => {
    const ids = new Set<string>();
    if (!query.trim()) return ids;
    const all = flattenTree(historyTree);
    all.forEach((n) => {
      const q = query.toLowerCase();
      if (
        n.name.includes(q) ||
        n.nameEn?.toLowerCase().includes(q) ||
        n.content?.tags.some((t) => t.toLowerCase().includes(q)) ||
        n.content?.overview.toLowerCase().includes(q)
      ) {
        ids.add(n.id);
      }
    });
    return ids;
  }, [query]);

  const allTimelineNodes = useMemo(() => {
    const sections = historyTree.children || [];
    const result: { node: DynastyNode; regionName: string }[] = [];
    for (const section of sections) {
      if (section.children) {
        for (const child of section.children) {
          result.push(...collectNodes(child, section.name));
        }
      }
    }
    return result;
  }, []);

  const selectedNode = selectedId ? findNodeById(historyTree, selectedId) : undefined;

  const handleSelect = useCallback((id: string) => {
    setSelectedId(id);
  }, []);

  if (showSplash) {
    return <SplashScreen onComplete={() => setShowSplash(false)} />;
  }

  return (
    <div className="h-full overflow-hidden" style={{ background: '#080808', color: 'rgba(255,255,255,0.85)' }}>
      <Starfield />
      <ArchiveParticles />
      <CustomCursor snapEnabled={!selectedNode} />

      {/* Main layout */}
      <div className="relative z-10 h-full flex flex-col">
        {/* Top bar */}
        <header className="flex-shrink-0 px-8 py-4 flex items-center justify-between relative z-20">
          <div className="flex items-center gap-3">
            <h1 className="text-sm font-light tracking-[0.4em] uppercase" style={{ color: 'rgba(255,255,255,0.7)' }}>历史资料库</h1>
            <span style={{ color: 'rgba(255,255,255,0.15)' }}>·</span>
            <span className="text-[10px] tracking-[0.3em] uppercase" style={{ color: 'rgba(255,255,255,0.25)' }}>HISTORY ARCHIVE</span>
          </div>

          {/* Search */}
          <div className="relative">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="搜索朝代、人物、事件…"
              className="w-64 h-8 pl-8 pr-3 rounded-full text-xs outline-none transition-all duration-500"
              style={{
                background: 'rgba(255,255,255,0.03)',
                color: 'rgba(255,255,255,0.7)',
                border: '1px solid rgba(255,255,255,0.06)',
              }}
              onFocus={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)';
              }}
            />
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: 'rgba(255,255,255,0.2)' }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            {query && (
              <button
                onClick={clearSearch}
                className="absolute right-3 top-1/2 -translate-y-1/2"
                style={{ color: 'rgba(255,255,255,0.25)' }}
              >
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </header>

        {/* Unified timeline — bottom (DOM first, order-2 to push below) */}
        <section className="flex-1 min-h-0 order-2">
          <UnifiedTimeline
            nodes={allTimelineNodes}
            selectedId={selectedId}
            highlightedIds={highlightedIds}
            onSelect={handleSelect}
          />
        </section>

        {/* News cards section — top (DOM second, always paints above timeline cards) */}
        <section className="flex-shrink-0 h-[20vh] min-h-[140px] order-1" style={{ background: '#080808' }}>
          <NewsCards />
        </section>

        {/* Footer hint */}
        <div className="flex-shrink-0 pb-3 text-center order-3" style={{ background: '#080808' }}>
          <p className="text-[10px] tracking-[0.3em] uppercase" style={{ color: 'rgba(255,255,255,0.12)' }}>
            {query ? `${highlightedIds.size} 个搜索结果` : 'SCROLL · DRAG · CLICK TO EXPLORE'}
          </p>
        </div>
      </div>

      {/* Detail overlay */}
      {selectedNode && (
        <DetailOverlay
          node={selectedNode}
          onClose={() => setSelectedId(null)}
          onNavigate={handleSelect}
        />
      )}
    </div>
  );
}
