import { NextResponse } from 'next/server';

export const revalidate = 15; 

export async function GET() {
  // 1. YOUR CUSTOM SEARCH RADAR
  // Add any specific countries, bases, or weapon systems you want to track here.
  const TARGET_KEYWORDS = [
    "hypersonic",
    "F-35",
    "drone swarm",
    "cyberattack",
    "carrier strike group",
    "Taiwan",
    "South China Sea",
    "iran",
    "Iran",
    "Israel",
    "USA",
    "strikes",
    "embassy",
    "consulate",
    "operation epic fury",
    "operating roaring lion",
    "regime change",
    "hormuz",
    "tehran",
    "tel aviv",
    "jerusalem",
    "fatah", " fateh",
    "irgc",
    "middle east",
    "irgc", "hezbollah", "al udeid",
    "attack"
    
  ];

  // Dynamically builds the search query: "hypersonic+OR+F-35+OR+drone+swarm..."
  const customQuery = TARGET_KEYWORDS.map(kw => encodeURIComponent(kw)).join('+OR+');

  const sources = [
    // Your Custom Keyword Feed
    { name: "OSINT // WATCHLIST", url: `https://news.google.com/rss/search?q=${"iran-usa-israel"}&hl=en-US&gl=US&ceid=US:en` },
    
    // The Standard Macro Feeds
    { name: "OSINT // GLOBAL", url: "https://news.google.com/rss/search?q=military+OR+strike+OR+missile+OR+war+OR+offensive&hl=en-US&gl=US&ceid=US:en" },
    { name: "OSINT // CENTCOM", url: "https://news.google.com/rss/search?q=CENTCOM+OR+Iran+OR+Israel+OR+Houthi+OR+Gaza&hl=en-US&gl=US&ceid=US:en" },
    { name: "OSINT // EUCOM", url: "https://news.google.com/rss/search?q=Ukraine+OR+Russia+OR+NATO+frontline&hl=en-US&gl=US&ceid=US:en" },
    
    // Reddit Tactical Feeds
    { name: "REDDIT // COMBAT", url: "https://www.reddit.com/r/CombatFootage/new/.rss" },
    { name: "REDDIT // DEFENSE", url: "https://www.reddit.com/r/CredibleDefense/new/.rss" }
  ];

  try {
    const feedPromises = sources.map(async (source) => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 4000); 

        const uas = [
            "Overwatch/4.0 (Windows NT 10.0; Win64; x64)",
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36"
        ];
        const headers = { "User-Agent": uas[Math.floor(Math.random() * uas.length)] };
        
        const fetchUrl = source.url.includes("reddit") ? `${source.url}?t=${Date.now()}` : source.url;

        const res = await fetch(fetchUrl, { signal: controller.signal, headers });
        clearTimeout(timeoutId);
        if (!res.ok) return [];

        const text = await res.text();
        const items = text.match(/<(?:item|entry)>[\s\S]*?<\/(?:item|entry)>/g) || [];

        return items.slice(0, 15).map(item => {
          const titleMatch = item.match(/<title[^>]*>(.*?)<\/title>/);
          let title = titleMatch ? titleMatch[1] : "Tactical Report";
          
          title = title.replace(/<!\[CDATA\[(.*?)\]\]>/g, "$1")
                       .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
                       .replace(/ - [^-]+$/, "").trim(); 

          let link = "";
          const atomLink = item.match(/<link[^>]*href=["']([^"']+)["']/);
          const rssLink = item.match(/<link[^>]*>(.*?)<\/link>/);
          if (atomLink && !atomLink[0].includes('rel="self"')) link = atomLink[1];
          else if (rssLink) link = rssLink[1];

          // Tag as CRITICAL if the title contains heavy kinetic keywords
          const isCritical = title.toUpperCase().match(/MISSILE|STRIKE|ATTACK|DEAD|KILLED|EXPLOSION/);

          return {
            title,
            link,
            source: source.name,
            timestamp: new Date().toISOString(),
            type: isCritical ? "CRITICAL" : "ROUTINE"
          };
        });
      } catch (e) { return []; }
    });

    const results = await Promise.all(feedPromises);
    const flatResults = results.flat().filter(r => r.title);

    return NextResponse.json({ data: flatResults });
  } catch (e) {
    return NextResponse.json({ data: [] }, { status: 500 });
  }
}