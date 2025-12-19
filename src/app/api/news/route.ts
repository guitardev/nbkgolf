import { NextResponse } from 'next/server';

export async function GET() {
    const API_KEY = process.env.NEWS_API_KEY;

    try {
        if (!API_KEY) {
            console.log('No News API Key found.');
            return NextResponse.json({ status: 'success', results: [] });
        }

        // Free tier of newsdata.io allows generous calls. 
        // Searching for 'golf' in English and Thai.
        const response = await fetch(
            `https://newsdata.io/api/1/news?apikey=${API_KEY}&q=golf&language=en,th&image=1&removeduplicate=1`
        );

        if (!response.ok) {
            console.error(`News API responded with ${response.status}`);
            return NextResponse.json({ status: 'error', results: [] });
        }

        const data = await response.json();

        // Check if we actually got results
        if (!data.results || data.results.length === 0) {
            return NextResponse.json({ status: 'success', results: [] });
        }

        return NextResponse.json(data);
    } catch (error) {
        console.error('Error fetching news:', error);
        // Return empty results on error so the UI handles it gracefully (hides section)
        return NextResponse.json({ status: 'error', results: [] });
    }
}
