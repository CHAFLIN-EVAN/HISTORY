import { useEffect, useState } from 'react';
import { fetchNews, type NewsItem, getCategoryIcon, getCategoryLabel } from '../services/newsService';

export default function NewsPanel() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [collapsed, setCollapsed] = useState(true);

  useEffect(() => {
    fetchNews().then((items) => {
      setNews(items);
      setLoading(false);
    });
  }, []);

  return (
    <div className="fixed bottom-6 right-6 z-30">
      {collapsed ? (
        <button
          onClick={() => setCollapsed(false)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-full
                     bg-white/[0.06] border border-white/[0.10] backdrop-blur-xl
                     text-white/60 text-xs hover:bg-white/[0.10] hover:text-white/80
                     transition-all shadow-lg shadow-black/20"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
          </svg>
          时事
        </button>
      ) : (
        <div className="w-80 rounded-2xl bg-zinc-900/85 backdrop-blur-2xl border border-white/[0.10]
                        shadow-2xl shadow-black/30 overflow-hidden transition-all">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              <h3 className="text-xs font-medium text-white/60 tracking-wider">时事新闻</h3>
            </div>
            <button
              onClick={() => setCollapsed(true)}
              className="text-white/25 hover:text-white/50 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="max-h-80 overflow-y-auto content-scroll">
            {loading ? (
              <div className="px-4 py-8 text-center">
                <div className="w-5 h-5 mx-auto border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
                <p className="text-xs text-white/30 mt-3">抓取新闻中…</p>
              </div>
            ) : news.length === 0 ? (
              <div className="px-4 py-8 text-center text-xs text-white/30">暂无新闻</div>
            ) : (
              <div className="p-2">
                {news.map((item, i) => (
                  <a
                    key={i}
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-start gap-2.5 px-3 py-2.5 rounded-lg
                             hover:bg-white/[0.04] transition-colors block"
                  >
                    <span className="text-sm flex-shrink-0 mt-0.5">{getCategoryIcon(item.category)}</span>
                    <div className="min-w-0">
                      <p className="text-xs text-white/75 leading-relaxed line-clamp-2">{item.title}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] text-white/25">{item.source}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/[0.04] text-white/30">
                          {getCategoryLabel(item.category)}
                        </span>
                      </div>
                    </div>
                  </a>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-2 border-t border-white/[0.06] text-[10px] text-white/20 text-center">
            数据来源：RSS 新闻聚合 · 每小时更新
          </div>
        </div>
      )}
    </div>
  );
}
