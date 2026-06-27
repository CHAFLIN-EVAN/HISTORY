import { useState, useEffect, useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { fetchNews, type NewsItem } from '../services/newsService';

gsap.registerPlugin(useGSAP);

const CATEGORY_CONFIG: Record<NewsItem['category'], { emoji: string; gradient: string; accent: string }> = {
  politics: { emoji: '🏛️', gradient: 'from-blue-950 to-blue-900/40', accent: 'bg-blue-500/20' },
  economy: { emoji: '📊', gradient: 'from-emerald-950 to-emerald-900/40', accent: 'bg-emerald-500/20' },
  culture: { emoji: '🎭', gradient: 'from-purple-950 to-purple-900/40', accent: 'bg-purple-500/20' },
  history: { emoji: '📜', gradient: 'from-amber-950 to-amber-900/40', accent: 'bg-amber-500/20' },
};

function NewsCardSkeleton() {
  return (
    <div className="flex-1 min-w-0 rounded-2xl border overflow-hidden animate-pulse" style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.04)' }}>
      <div className="h-24" style={{ background: 'rgba(255,255,255,0.02)' }} />
      <div className="p-4 space-y-2">
        <div className="h-3 rounded w-3/4" style={{ background: 'rgba(255,255,255,0.04)' }} />
        <div className="h-3 rounded w-1/2" style={{ background: 'rgba(255,255,255,0.02)' }} />
      </div>
    </div>
  );
}

export default function NewsCards() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

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

  useGSAP(() => {
    if (loading || news.length === 0) return;
    gsap.fromTo('.news-card',
      { autoAlpha: 0, y: 30 },
      { autoAlpha: 1, y: 0, duration: 0.5, stagger: 0.1, ease: 'power3.out' }
    );
  }, { dependencies: [loading, news.length], scope: containerRef });

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
      <div className="flex items-center justify-center h-full px-8">
        <span className="text-xs tracking-wider" style={{ color: 'rgba(255,255,255,0.12)' }}>暂无新闻数据 · 请检查网络连接</span>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="flex gap-4 px-8 h-full">
      {news.map((item, i) => {
        const config = CATEGORY_CONFIG[item.category];
        return (
          <a
            key={i}
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="news-card flex-1 min-w-0 rounded-2xl overflow-hidden transition-all duration-300 group flex flex-col"
            style={{
              visibility: 'hidden',
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.04)',
              boxShadow: '0 1px 8px rgba(0,0,0,0.2)',
            }}
          >
            <div className={`relative h-24 bg-gradient-to-br ${config.gradient} flex items-center justify-center`}>
              <span className="text-3xl opacity-30">{config.emoji}</span>
              <span className={`absolute top-3 right-3 text-[9px] px-2 py-0.5 rounded-full ${config.accent}`} style={{ color: 'rgba(255,255,255,0.5)' }}>
                {item.category === 'politics' ? '政治' : item.category === 'economy' ? '经济' : item.category === 'culture' ? '文化' : '历史'}
              </span>
            </div>

            <div className="p-4 flex flex-col flex-1">
              <h3 className="text-sm leading-relaxed line-clamp-2 mb-3 transition-colors" style={{ color: 'rgba(255,255,255,0.55)' }}>
                {item.title}
              </h3>
              <div className="mt-auto flex items-center justify-between text-[10px]" style={{ color: 'rgba(255,255,255,0.15)' }}>
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
