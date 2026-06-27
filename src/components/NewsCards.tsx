import { useState, useEffect, useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { fetchNews, type NewsItem } from '../services/newsService';

gsap.registerPlugin(useGSAP);

const CATEGORY_CONFIG: Record<NewsItem['category'], { emoji: string; gradient: string; accent: string }> = {
  politics: { emoji: '🏛️', gradient: 'from-blue-100 to-blue-50', accent: 'bg-blue-200' },
  economy: { emoji: '📊', gradient: 'from-emerald-100 to-emerald-50', accent: 'bg-emerald-200' },
  culture: { emoji: '🎭', gradient: 'from-purple-100 to-purple-50', accent: 'bg-purple-200' },
  history: { emoji: '📜', gradient: 'from-amber-100 to-amber-50', accent: 'bg-amber-200' },
};

function NewsCardSkeleton() {
  return (
    <div className="flex-1 min-w-0 rounded-2xl border overflow-hidden animate-pulse" style={{ background: '#FCFBF8', borderColor: 'rgba(0,0,0,0.06)' }}>
      <div className="h-24" style={{ background: 'rgba(0,0,0,0.02)' }} />
      <div className="p-4 space-y-2">
        <div className="h-3 rounded w-3/4" style={{ background: 'rgba(0,0,0,0.05)' }} />
        <div className="h-3 rounded w-1/2" style={{ background: 'rgba(0,0,0,0.03)' }} />
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
        <span className="text-xs tracking-wider" style={{ color: '#C8C3B8' }}>暂无新闻数据 · 请检查网络连接</span>
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
              background: '#FCFBF8',
              border: '1px solid rgba(0,0,0,0.06)',
              boxShadow: '0 1px 8px rgba(0,0,0,0.03)',
            }}
          >
            <div className={`relative h-24 bg-gradient-to-br ${config.gradient} flex items-center justify-center`}>
              <span className="text-3xl opacity-30">{config.emoji}</span>
              <span className={`absolute top-3 right-3 text-[9px] px-2 py-0.5 rounded-full ${config.accent} bg-opacity-40`} style={{ color: '#5C5852' }}>
                {item.category === 'politics' ? '政治' : item.category === 'economy' ? '经济' : item.category === 'culture' ? '文化' : '历史'}
              </span>
            </div>

            <div className="p-4 flex flex-col flex-1">
              <h3 className="text-sm leading-relaxed line-clamp-2 mb-3 transition-colors" style={{ color: '#3D3A35' }}>
                {item.title}
              </h3>
              <div className="mt-auto flex items-center justify-between text-[10px]" style={{ color: '#B8B2A8' }}>
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
