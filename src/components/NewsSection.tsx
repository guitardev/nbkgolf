'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import { ExternalLink, Calendar, Newspaper } from 'lucide-react';

interface NewsItem {
    article_id: string;
    title: string;
    link: string;
    image_url: string;
    pubDate: string;
    description: string;
}

export default function NewsSection() {
    const t = useTranslations('home.news');
    const [news, setNews] = useState<NewsItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchNews() {
            try {
                const res = await fetch('/api/news');
                const data = await res.json();
                if (data.results) {
                    // Take only first 4 items
                    setNews(data.results.slice(0, 4));
                }
            } catch (error) {
                console.error('Failed to fetch news', error);
            } finally {
                setLoading(false);
            }
        }

        fetchNews();
    }, []);

    if (loading) {
        return (
            <div className="py-12 w-full">
                <div className="animate-pulse grid grid-cols-1 md:grid-cols-2 gap-6">
                    {[1, 2].map((i) => (
                        <div key={i} className="bg-white rounded-3xl h-80 shadow-sm border border-gray-100"></div>
                    ))}
                </div>
            </div>
        );
    }

    if (news.length === 0) return null;

    return (
        <section className="py-12 bg-gray-900 border-t border-gray-800">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center gap-3 mb-8">
                    <Newspaper className="w-6 h-6 text-emerald-500" />
                    <h2 className="text-2xl font-bold text-white">{t('latestNews')}</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {news.map((item) => (
                        <a
                            key={item.article_id}
                            href={item.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group block bg-gray-800 rounded-xl overflow-hidden hover:ring-2 hover:ring-emerald-500 transition-all duration-300 transform hover:-translate-y-1"
                        >
                            <div className="relative h-48 w-full overflow-hidden">
                                <Image
                                    src={item.image_url || '/golf-placeholder.jpg'} // Fallback if api returns null image
                                    alt={item.title}
                                    fill
                                    className="object-cover transition-transform duration-500 group-hover:scale-110"
                                    unoptimized // Since URLs are external
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
                            </div>

                            <div className="p-5">
                                <div className="flex items-center gap-2 text-xs text-emerald-400 mb-2">
                                    <Calendar className="w-3 h-3" />
                                    {new Date(item.pubDate).toLocaleDateString()}
                                </div>
                                <h3 className="text-white font-semibold line-clamp-2 mb-3 group-hover:text-emerald-400 transition-colors">
                                    {item.title}
                                </h3>
                                <p className="text-gray-400 text-sm line-clamp-3 mb-4">
                                    {item.description}
                                </p>
                                <div className="flex items-center text-sm text-emerald-500 font-medium">
                                    {t('readMore')} <ExternalLink className="w-3 h-3 ml-1" />
                                </div>
                            </div>
                        </a>
                    ))}
                </div>
            </div>
        </section>
    );
}
