import { NextResponse } from 'next/server';
import { XMLParser } from 'fast-xml-parser';

// Edge Runtime for better Vercel compatibility and speed
export const runtime = 'edge';
export const preferredRegion = ['sin1', 'hkg1', 'iad1'];

interface NewsItem {
  title: string;
  link: string;
  pubDate: string;
  description: string;
  source: string;
  thumbnail: string;
}

const RSS_SOURCES = [
  {
    url: 'https://www.coindesk.com/arc/outboundfeeds/rss/',
    name: 'CoinDesk',
  },
  {
    url: 'https://cointelegraph.com/rss',
    name: 'CoinTelegraph',
  },
];

const xmlParser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  trimValues: true,
});

async function fetchAndParseRSS(
  url: string,
  sourceName: string
): Promise<NewsItem[]> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; TrenovaBot/1.0)',
        Accept: 'application/rss+xml, application/xml, text/xml',
      },
      cache: 'no-store',
    });
    clearTimeout(timeout);

    if (!res.ok) {
      console.error(`RSS fetch failed for ${sourceName}: ${res.status}`);
      return [];
    }

    const xml = await res.text();
    const parsed = xmlParser.parse(xml);

    const channel = parsed?.rss?.channel;
    if (!channel?.item) return [];

    const items = Array.isArray(channel.item) ? channel.item : [channel.item];

    return items.map((item: any) => {
      // Extract thumbnail from media:content, media:thumbnail, or enclosure
      let thumbnail = '';
      if (item['media:content']?.['@_url']) {
        thumbnail = item['media:content']['@_url'];
      } else if (item['media:thumbnail']?.['@_url']) {
        thumbnail = item['media:thumbnail']['@_url'];
      } else if (item.enclosure?.['@_url']) {
        thumbnail = item.enclosure['@_url'];
      }

      // Clean description from HTML tags
      let description = item.description || item['content:encoded'] || '';
      if (typeof description !== 'string') description = String(description);
      description = description
        .replace(/<[^>]+>/g, '')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .slice(0, 200);

      return {
        title: typeof item.title === 'string' ? item.title : String(item.title || ''),
        link: typeof item.link === 'string' ? item.link : String(item.link || ''),
        pubDate: typeof item.pubDate === 'string' ? item.pubDate : String(item.pubDate || ''),
        description,
        source: sourceName,
        thumbnail,
      };
    });
  } catch (error) {
    console.error(`RSS parse error for ${sourceName}:`, error);
    return [];
  }
}

export async function GET() {
  try {
    // Fetch all RSS feeds in parallel
    const results = await Promise.allSettled(
      RSS_SOURCES.map((src) => fetchAndParseRSS(src.url, src.name))
    );

    // Merge all successful results
    const allNews: NewsItem[] = [];
    for (const result of results) {
      if (result.status === 'fulfilled') {
        allNews.push(...result.value);
      }
    }

    // Sort by date (newest first)
    allNews.sort((a, b) => {
      const dateA = new Date(a.pubDate).getTime() || 0;
      const dateB = new Date(b.pubDate).getTime() || 0;
      return dateB - dateA;
    });

    // Return top 50
    const top50 = allNews.slice(0, 50);

    return NextResponse.json(top50, {
      headers: {
        'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=300',
      },
    });
  } catch (error) {
    console.error('News API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch news' },
      { status: 500 }
    );
  }
}
