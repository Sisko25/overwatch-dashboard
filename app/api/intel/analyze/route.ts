import { NextResponse } from 'next/server';
import OpenAI from 'openai';

// 1. TARGETED CONFLICT AGGREGATOR
async function fetchOSINT() {
  const sources = [
    // --- 1. SUPERPOWERS & GLOBAL STRATEGY (USA/China/Russia) ---
    { name: "r/CredibleDefense", url: "https://www.reddit.com/r/CredibleDefense/new/.rss" }, // High quality analysis
    { name: "r/Geopolitics", url: "https://www.reddit.com/r/geopolitics/new/.rss" }, // Global maneuvering

    // --- 2. EASTERN EUROPE (Ukraine - Russia) ---
    { name: "r/UkraineWarVideoReport", url: "https://www.reddit.com/r/UkraineWarVideoReport/new/.rss" },
    { name: "r/UkrainianConflict", url: "https://www.reddit.com/r/UkrainianConflict/new/.rss" },

    // --- 3. MIDDLE EAST (Israel, Iran, Syria, Yemen) ---
    { name: "r/SyrianCivilWar", url: "https://www.reddit.com/r/SyrianCivilWar/new/.rss" }, // Covers Syria/Turkey/Israel/Russia
    { name: "r/NewIran", url: "https://www.reddit.com/r/NewIran/new/.rss" }, // Iran internal & proxies
    { name: "r/IsraelPalestine", url: "https://www.reddit.com/r/IsraelPalestine/new/.rss" }, // Israel/Gaza/WB
    { name: "r/YemenVoice", url: "https://www.reddit.com/r/YemenVoice/new/.rss" }, // Yemen Civil War

    // --- 4. SOUTH ASIA (India, Pakistan, Kashmir, China Border) ---
    { name: "r/IndianDefense", url: "https://www.reddit.com/r/IndianDefense/new/.rss" }, // Best for India-China/Pak/Kashmir
    { name: "r/Pakistan", url: "https://www.reddit.com/r/pakistan/new/.rss" }, // Covers Afg border/India tension
    { name: "r/AfghanConflict", url: "https://www.reddit.com/r/AfghanConflict/new/.rss" }, // Taliban/Resistance

    // --- 5. EAST ASIA (China, Japan, Koreas) ---
    { name: "r/NorthKoreaNews", url: "https://www.reddit.com/r/NorthKoreaNews/new/.rss" }, // DPRK/SK/Japan
    // (Note: r/IndianDefense and r/CredibleDefense often cover China-Taiwan/Japan)

    // --- 6. SOUTHEAST ASIA (Myanmar, Bangladesh, India Border) ---
    { name: "r/Myanmarcombatfootage", url: "https://www.reddit.com/r/Myanmarcombatfootage/new/.rss" }, // Intense kinetic feed
    { name: "r/Bangladesh", url: "https://www.reddit.com/r/bangladesh/new/.rss" }, // Internal politics/border issues

    // --- 7. AFRICA (Civil Wars, Coups) ---
    { name: "r/Africa", url: "https://www.reddit.com/r/africa/new/.rss" }, // Sahel coups, Sudan civil war

    // --- 8. AMERICAS (Venezuela) ---
    { name: "r/venezuela", url: "https://www.reddit.com/r/venezuela/new/.rss" }, // Politics & unrest
  ];

  try {
    const feedPromises = sources.map(async (source) => {
      try {
        // Fetch with a timeout signal to prevent hanging
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 4000); // 4s timeout per feed
        
        const res = await fetch(source.url, { 
          next: { revalidate: 300 },
          signal: controller.signal 
        });
        clearTimeout(timeoutId);

        if (!res.ok) return "";
        const text = await res.text();
        
        const items = text.match(/<entry>[\s\S]*?<\/entry>|<item>[\s\S]*?<\/item>/g) || [];
        
        // LIMIT: Top 2 items per source to keep payload light but diverse
        return items.slice(0, 2).map(item => {
          const titleMatch = item.match(/<title>(.*?)<\/title>/) || item.match(/<title type="html">(.*?)<\/title>/);
          let title = "Unknown Report";
          if (titleMatch) {
             title = titleMatch[1]
               .replace(/<!\[CDATA\[|\]\]>/g, "")
               .replace(/&quot;/g, '"')
               .replace(/&#39;/g, "'")
               .replace(/&amp;/g, "&");
          }

          const dateMatch = item.match(/<pubDate>(.*?)<\/pubDate>/) || item.match(/<updated>(.*?)<\/updated>/);
          let timeString = "Recent";
          if (dateMatch) {
            const d = new Date(dateMatch[1]);
            timeString = d.toLocaleString('en-US', { 
              month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false 
            });
          }

          return `[TIME: ${timeString}] [SRC: ${source.name}] ${title}`;
        }).join("\n");
        
      } catch (e) {
        return ""; // Skip failed feeds silently
      }
    });

    const results = await Promise.all(feedPromises);
    const rawText = results.filter(r => r.length > 0).join("\n");
    return [...new Set(rawText.split('\n'))].join('\n');

  } catch (e) {
    console.error("OSINT Aggregation Failed:", e);
    return null;
  }
}

export async function POST(req: Request) {
  try {
    const apiKey = process.env.DEEPSEEK_API_KEY;
    if (!apiKey) return NextResponse.json({ events: [], predictions: [] }, { status: 500 });

    const client = new OpenAI({ baseURL: 'https://api.deepseek.com', apiKey: apiKey });

    const body = await req.json().catch(() => ({})); 
    const { context } = body;
    
    const CURRENT_TIME = new Date().toLocaleString("en-US", { timeZone: "UTC" });

    const systemPrompt = `
      You are an elite Global Conflict Monitor (AI-GCM).
      
      INTEL SOURCES:
      You have access to a massive dragnet of specific conflict feeds (Indian Defense, Syrian Civil War, Myanmar Combat, etc).
      
      YOUR MISSION:
      1. ANALYZE the raw feed.
      2. EXTRACT 5-7 most critical "Kinetic" or "High Tension" events.
      3. FILTER OUT pure political gossip (unless it's Venezuela/Iran regime instability).
      
      MANDATORY COVERAGE CHECK:
      Scan the feed for these specific pairs. If news exists, prioritize it:
      - India vs (Pakistan/China/Myanmar)
      - Israel vs (Iran/Syria/Palestine)
      - USA vs (China/Iran/Russia)
      - Civil Wars (Myanmar, Sudan, Yemen, Syria)
      
      FALLBACK BEHAVIOR:
      If a specific region (e.g. Venezuela) has no *military* news today, do NOT invent a war.
      Instead, generate a "Standard Patrol" or "Border Surveillance" event for that region to show the system is monitoring it.
      
      OUTPUT FORMAT (Strict JSON):
      {
        "events": [
          { "lat": number, "lng": number, "title": string, "description": string, "date": string }
        ],
        "predictions": [
          {
            "id": string,
            "type": "MISSILE" | "GROUND" | "NAVAL",
            "origin_lat": number, "origin_lng": number,
            "target_lat": number, "target_lng": number,
            "location": string, 
            "prediction": string,
            "probability": "HIGH" | "MEDIUM"
          }
        ]
      }
      
      For "predictions", focus on flashpoints like: Taiwan Strait, Kashmir, Golan Heights, or Balkans.
    `;

    const userContent = rawIntel && rawIntel.length > 50
      ? `[GLOBAL DRAGNET - ${CURRENT_TIME}]\n${rawIntel}\n\nTask: Extract 6 critical events. Prioritize active combat (Myanmar/Ukraine) and strategic tension (Taiwan/Iran). Generate 3 forecasts.`
      : `[DATALINKS OFFLINE] Generate 6 realistic scenarios covering: 1. South China Sea, 2. Kashmir Border, 3. Syrian Border, 4. Venezuelan Unrest.`;

    const completion = await client.chat.completions.create({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userContent }
      ],
      model: "deepseek-chat", 
      temperature: 0.3, 
      response_format: { type: "json_object" }, 
      max_tokens: 2000,
    });

    const content = completion.choices[0].message.content || "{}";
    let result;
    try {
      result = JSON.parse(content);
    } catch (e) {
      result = { events: [], predictions: [] };
    }

    return NextResponse.json(result);

  } catch (error: any) {
    console.error("Analyst Error:", error.message);
    return NextResponse.json({ events: [], predictions: [] }, { status: 500 });
  }
}