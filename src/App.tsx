import { useState, useCallback, useMemo } from 'react';
import { historyTree, findNodeById, flattenTree } from './data';
import { useSearch } from './hooks/useSearch';
import { useUserData } from './hooks/useUserData';
import Starfield from './components/Starfield';
import CustomCursor from './components/CustomCursor';
import SplashScreen from './components/SplashScreen';
import TimelineRow from './components/TimelineRow';
import DetailOverlay from './components/DetailOverlay';
import NewsPanel from './components/NewsPanel';

export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { query, setQuery, clearSearch } = useSearch(historyTree);

  // Pre-load user data hook for future use (notes, favorites)
  useUserData();

  // Gather highlighted IDs from search
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

  const selectedNode = selectedId ? findNodeById(historyTree, selectedId) : undefined;
  const sections = historyTree.children || [];

  const handleSelect = useCallback((id: string) => {
    setSelectedId(id);
  }, []);

  if (showSplash) {
    return <SplashScreen onComplete={() => setShowSplash(false)} />;
  }

  return (
    <div className="h-full bg-black text-white overflow-hidden">
      <Starfield />
      <CustomCursor snapEnabled={!selectedNode} />

      {/* Main layout */}
      <div className="relative z-10 h-full flex flex-col">
        {/* Top bar */}
        <header className="flex-shrink-0 px-8 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-sm font-medium tracking-[0.2em] text-white/60">历史资料库</h1>
            <span className="text-white/10">·</span>
            <span className="text-[10px] tracking-widest text-white/25">HISTORY ARCHIVE</span>
          </div>

          {/* Search */}
          <div className="relative">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="搜索朝代、人物、事件…"
              className="w-64 h-8 pl-8 pr-3 bg-white/[0.04] hover:bg-white/[0.06] focus:bg-white/[0.08]
                         rounded-full text-xs text-white/70 placeholder-white/20
                         outline-none border border-white/[0.06] focus:border-white/[0.12]
                         transition-all"
            />
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-white/25" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            {query && (
              <button
                onClick={clearSearch}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/20 hover:text-white/40"
              >
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </header>

        {/* Timeline area */}
        <main className="flex-1 overflow-y-auto content-scroll px-8 pb-12">
          <div className="max-w-6xl mx-auto pt-4">
            {sections.map((section) => (
              <TimelineRow
                key={section.id}
                section={section}
                selectedId={selectedId}
                highlightedIds={highlightedIds}
                onSelect={handleSelect}
              />
            ))}
          </div>
        </main>

        {/* Hint */}
        <div className="flex-shrink-0 pb-4 text-center">
          <p className="text-[10px] tracking-widest text-white/15">
            {query ? `${highlightedIds.size} 个搜索结果` : '点击卡片探索文明历史'}
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

      {/* News panel */}
      <NewsPanel />
    </div>
  );
}
