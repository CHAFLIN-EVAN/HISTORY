import { useState, useEffect } from 'react';
import { fetchNews, type NewsItem } from '../services/newsService';

const CATEGORY_CONFIG: Record<NewsItem['category'], { emoji: string; gradient: string; accent: string }> = {
  politics: { emoji: '🏛️', gradient: 'from-blue-500/20 to-blue-700/5', accent: 'bg-blue-400' },
  economy: { emoji: '📊', gradient: 'from-emerald-500/20 to-emerald-700/5', accent: 'bg-emerald-400' },
  culture: { emoji: '🎭', gradient: 'from-purple-500/20 to-purple-700/5', accent: 'bg-purple-400' },
  history: { emoji: '📜', gradient: 'from-amber-500/20 to-amber-700/5', accent: 'bg-amber-400' },
};

function NewsCardSkeleton() {
  return (
    <div className="flex-1 min-w-0 rounded-2xl bg-white/[0.04] border border-white/[0.06] overflow-hidden animate-pulse">
      <div className="h-24 bg-white/[0.02]" />
      <div className="p-4 space-y-2">
        <div className="h-3 bg-white/[0.06] rounded w-3/4" />
        <div className="h-3 bg-white/[0.04] rounded w-1/2" />
      </div>
    </div>
  );
}

export default function NewsCards() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetchNews().then((items) => {
      if (!cancelled) {
        setNews(items.slice(0, 3));
        setLoading(false);
      }
    }).catch(() => {
      if (!cancelled) setLoading(false);
    });
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return (
      <div className="flex gap-4 px-8">
        <NewsCardSkeleton />
        <NewsCardSkeleton />
        <NewsCardSkeleton />
      </div>
    );
  }

  if (news.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-white/15 text-xs tracking-wider px-8">
        暂无新闻数据 · 请检查网络连接
      </div>
    );
  }

  return (
    <div className="flex gap-4 px-8 h-full">
      {news.map((item, i) => {
        const config = CATEGORY_CONFIG[item.category];
        return (
          <a
            key={i}
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className={`flex-1 min-w-0 rounded-2xl bg-white/[0.04] hover:bg-white/[0.07] border border-white/[0.06] hover:border-white/[0.12] overflow-hidden transition-all duration-300 group flex flex-col`}
          >
            {/* Thumbnail placeholder */}
            <div className={`relative h-24 bg-gradient-to-br ${config.gradient} flex items-center justify-center`}>
              <span className="text-3xl opacity-40">{config.emoji}</span>
              <span className={`absolute top-3 right-3 text-[9px] px-2 py-0.5 rounded-full ${config.accent} bg-opacity-15 text-white/50`}>
                {item.category === 'politics' ? '政治' : item.category === 'economy' ? '经济' : item.category === 'culture' ? '文化' : '历史'}
              </span>
            </div>

            {/* Content */}
            <div className="p-4 flex flex-col flex-1">
              <h3 className="text-sm text-white/80 group-hover:text-white leading-relaxed line-clamp-2 mb-3 transition-colors">
                {item.title}
              </h3>
              <div className="mt-auto flex items-center justify-between text-[10px] text-white/25">
                <span>{item.source}</span>
                <span>{item.date}</span>
              </div>
            </div>
          </a>
        );
      })}
    </div>
  );
}
