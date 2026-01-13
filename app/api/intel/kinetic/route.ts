import { NextResponse } from 'next/server';
import Parser from 'rss-parser';

const parser = new Parser();
const CRITICAL_KEYWORDS = ["missile", "strike", "blast", "air raid", "explosion", "artillery", "attack", "bombing"];

export async function GET() {
  try {
    const googleNewsUrl = `https://news.google.com/rss/search?q=missile+strike+OR+air+raid+OR+explosion+when:1h&ceid=US:en&hl=en-US&gl=US`;
    const redditCombatUrl = `https://www.reddit.com/r/CombatFootage/new/.rss`;

    const [googleFeed, redditFeed] = await Promise.all([
        parser.parseURL(googleNewsUrl).catch(() => ({ items: [] })),
        parser.parseURL(redditCombatUrl).catch(() => ({ items: [] }))
    ]);

    const normalize = (item: any, source: string) => {
      const title = item.title || "";
      const isCritical = CRITICAL_KEYWORDS.some(k => title.toLowerCase().includes(k));
      return {
        id: item.guid || item.link,
        title: title,
        link: item.link,
        pubDate: item.pubDate,
        source: source,
        type: isCritical ? "CRITICAL" : "INTEL",
        timestamp: new Date(item.pubDate || Date.now()).getTime()
      };
    };

    const newsItems = googleFeed.items.map(i => normalize(i, "G-NEWS"));
    const redditItems = redditFeed.items.map(i => normalize(i, "REDDIT"));
    const combined = [...newsItems, ...redditItems].sort((a, b) => b.timestamp - a.timestamp);

    return NextResponse.json({ status: "online", data: combined.slice(0, 30) });
  } catch (error) {
    return NextResponse.json({ status: "error", message: "Intel Feed Down" }, { status: 500 });
  }
}