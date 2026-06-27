// News fetching service with localStorage caching

export interface NewsItem {
  title: string;
  source: string;
  url: string;
  date: string;
  category: 'politics' | 'economy' | 'culture' | 'history';
}

const CACHE_KEY = 'history-db-news';
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour

function getCached(): { data: NewsItem[]; ts: number } | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Date.now() - parsed.ts < CACHE_DURATION) return parsed;
    }
  } catch {}
  return null;
}

function setCache(data: NewsItem[]) {
  localStorage.setItem(CACHE_KEY, JSON.stringify({ data, ts: Date.now() }));
}

// Try fetching from multiple RSS-to-JSON proxies
const RSS_FEEDS = [
  'https://api.allorigins.win/raw?url=' + encodeURIComponent('https://rsshub.app/zaobao/realtime/china'),
  'https://api.rss2json.com/v1/api.json?rss_url=' + encodeURIComponent('https://feeds.bbci.co.uk/news/world/asia/china/rss.xml'),
];

// Fallback: "This Day in History" generated from historical data
const THIS_DAY_IN_HISTORY: NewsItem[] = [
  { title: '公元前221年，秦王嬴政完成统一六国，自称始皇帝', source: '历史上的今天', url: '#', date: '', category: 'history' },
  { title: '公元618年，李渊在长安称帝，建立唐朝', source: '历史上的今天', url: '#', date: '', category: 'history' },
  { title: '公元960年，赵匡胤陈桥兵变，建立宋朝', source: '历史上的今天', url: '#', date: '', category: 'history' },
  { title: '公元1368年，朱元璋在应天府称帝，明朝建立', source: '历史上的今天', url: '#', date: '', category: 'history' },
  { title: '公元1644年，清军入关，定都北京', source: '历史上的今天', url: '#', date: '', category: 'history' },
  { title: '1912年1月1日，孙中山就任中华民国临时大总统', source: '历史上的今天', url: '#', date: '', category: 'history' },
];

export async function fetchNews(): Promise<NewsItem[]> {
  // Return cache if fresh
  const cached = getCached();
  if (cached) return cached.data;

  // Try to fetch from RSS
  for (const feed of RSS_FEEDS) {
    try {
      const res = await fetch(feed, { signal: AbortSignal.timeout(5000) });
      const json = await res.json();
      const items = (json.items || json.entries || []).slice(0, 10).map((item: any) => ({
        title: item.title || '',
        source: item.source?.name || json.feed?.title || '新闻',
        url: item.link || item.url || '#',
        date: item.pubDate || item.published || '',
        category: detectCategory(item.title + ' ' + (item.description || '')),
      }));
      if (items.length > 0) {
        setCache(items);
        return items;
      }
    } catch {
      // Try next feed
    }
  }

  // Fallback to historical facts
  const shuffled = [...THIS_DAY_IN_HISTORY].sort(() => Math.random() - 0.5).slice(0, 5);
  setCache(shuffled);
  return shuffled;
}

function detectCategory(text: string): NewsItem['category'] {
  const t = text.toLowerCase();
  if (/经济|GDP|贸易|股票|市场|通胀/.test(t)) return 'economy';
  if (/文化|艺术|文学|电影|音乐|博物馆/.test(t)) return 'culture';
  if (/历史|考古|文物|古迹|遗址/.test(t)) return 'history';
  return 'politics';
}

export function getCategoryIcon(cat: NewsItem['category']): string {
  const map = { politics: '🏛', economy: '📊', culture: '🎨', history: '📜' };
  return map[cat];
}

export function getCategoryLabel(cat: NewsItem['category']): string {
  const map = { politics: '政治', economy: '经济', culture: '文化', history: '历史' };
  return map[cat];
}
