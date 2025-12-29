import { NextResponse } from 'next/server';
import Parser from 'rss-parser';

// Define Interface for News Items
interface NewsItem {
    article_id: string;
    title: string;
    link: string;
    image_url?: string;
    pubDate: string;
    description: string;
    source: string;
}

export async function GET() {


    const parser = new Parser({
        headers: {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'application/rss+xml, application/xml, text/xml; q=0.1',
        }
    });

    // Use Google News RSS for reliable aggregation
    // Query: "กอล์ฟ OR lpga OR pga" (Encoded)
    const GOOGLE_NEWS_RSS = 'https://news.google.com/rss/search?q=%E0%B8%81%E0%B8%AD%E0%B8%A5%E0%B9%8C%E0%B8%9F+OR+lpga+OR+pga&hl=th&gl=TH&ceid=TH:th';

    try {
        const feed = await parser.parseURL(GOOGLE_NEWS_RSS);

        const newsResults: NewsItem[] = feed.items.map(item => {
            // Extract image from description (Google News puts it in <a><img ...></a>)
            let imageUrl = '';
            const imgMatch = item.content?.match(/<img[^>]+src="([^">]+)"/) || item.contentSnippet?.match(/<img[^>]+src="([^">]+)"/);
            if (imgMatch) {
                imageUrl = imgMatch[1];
            }

            return {
                article_id: item.guid || item.link || Math.random().toString(36).substr(2, 9),
                title: item.title || 'No Title',
                link: item.link || '#',
                image_url: imageUrl || 'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?auto=format&fit=crop&q=80',
                pubDate: item.pubDate || new Date().toISOString(),
                description: item.title || '', // Google News description is often just links, title is better
                source: item.source?.trim() || 'Google News'
            };
        }).slice(0, 10);

        return NextResponse.json({
            status: 'success',
            results: newsResults
        });

    } catch (error) {
        console.error('Error in News Aggregator:', error);
        return NextResponse.json({ status: 'error', results: [] });
    }
}
