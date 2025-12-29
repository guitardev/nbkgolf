import { NextResponse } from 'next/server';
import Parser from 'rss-parser';

// Define Interface for News Items
interface NewsItem {
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

    // List of Thai Sports RSS Feeds
    const FEEDS = [
        { url: 'https://rss.sanook.com/rss/sport.xml', name: 'Sanook' },
        { url: 'https://www.matichon.co.th/category/sport/sport-social/feed', name: 'Matichon' },
        { url: 'https://www.thairath.co.th/rss/news/sport', name: 'Thairath' }
    ];

    // Keywords to filter for Golf content
    const KEYWORDS = ['กอล์ฟ', 'Golf', 'lpga', 'pga', 'โปรจีน', 'โปรเม', 'โปรช้าง', 'โปรอาร์ม'];

    try {
        const fetchFeed = async (source: { url: string, name: string }) => {
            try {
                const feed = await parser.parseURL(source.url);
                return feed.items.map(item => ({ ...item, sourceName: source.name }));
            } catch (err) {
                console.error(`Error fetching feed ${source.name}:`, err);
                return [];
            }
        };

        // Fetch all feeds in parallel
        const allFeedItems = await Promise.all(FEEDS.map(fetchFeed));
        const flatItems = allFeedItems.flat();

        // Filter and Map items
        const newsResults: NewsItem[] = flatItems
            .filter(item => {
                const title = item.title?.toLowerCase() || '';
                const desc = item.contentSnippet?.toLowerCase() || item.content?.toLowerCase() || '';
                return KEYWORDS.some(kw => title.includes(kw.toLowerCase()) || desc.includes(kw.toLowerCase()));
            })
            .map(item => {
                // Extract image from content if possible (RSS often puts img in content:encoded or description)
                let imageUrl = '';
                if (item.enclosure && item.enclosure.url && item.enclosure.type?.startsWith('image')) {
                    imageUrl = item.enclosure.url;
                } else if (item.content) {
                    const imgMatch = item.content.match(/<img[^>]+src="([^">]+)"/);
                    if (imgMatch) imageUrl = imgMatch[1];
                }

                return {
                    title: item.title || 'No Title',
                    link: item.link || '#',
                    image_url: imageUrl || 'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?auto=format&fit=crop&q=80', // Fallback golf image
                    pubDate: item.pubDate || new Date().toISOString(),
                    description: item.contentSnippet || item.content || '',
                    source: item.sourceName as string
                };
            })
            .sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime()) // Sort by newest
            .slice(0, 10); // Limit to top 10 news

        return NextResponse.json({
            status: 'success',
            results: newsResults
        });

    } catch (error) {
        console.error('Error in News Aggregator:', error);
        return NextResponse.json({ status: 'error', results: [] });
    }
}
