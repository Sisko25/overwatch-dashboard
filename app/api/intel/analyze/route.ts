import { NextResponse } from 'next/server';
import OpenAI from 'openai';

async function fetchOSINT() {
  const sources = [
    { name: "G-NEWS: World", url: "https://news.google.com/rss/headlines/section/topic/WORLD?hl=en-US&gl=US&ceid=US:en" },
    { name: "G-NEWS: MidEast", url: "https://news.google.com/rss/search?q=Israel+OR+Iran+OR+Bahrain+OR+UAE+OR+Kuwait+OR+Qatar+strike+OR+missile&hl=en-US&gl=US&ceid=US:en" },
    { name: "TG: Rybar (RUS)", url: "https://rsshub.app/telegram/channel/rybar" },
    { name: "TG: DeepState (UKR)", url: "https://rsshub.app/telegram/channel/DeepStateUA" },
    { name: "TG: IDF (ISR)", url: "https://rsshub.app/telegram/channel/idfofficial" },
    { name: "TG: Sabereen (IRN)", url: "https://rsshub.app/telegram/channel/sabereennews" },
    { name: "r/CredibleDefense", url: "https://www.reddit.com/r/CredibleDefense/new/.rss" },
    { name: "r/UkraineWarVideoReport", url: "https://www.reddit.com/r/UkraineWarVideoReport/new/.rss" },
    { name: "GDELT: USA-IRN", url: "https://api.gdeltproject.org/api/v2/doc/doc?query=(USA%20OR%20Biden)%20AND%20(Iran%20OR%20Tehran)&mode=artlist&maxrecords=10&format=rss&sort=datedesc" },
    { name: "GDELT: ISR-IRN", url: "https://api.gdeltproject.org/api/v2/doc/doc?query=(Israel%20OR%20IDF)%20AND%20(Iran%20OR%20Tehran%20OR%20Hezbollah)&mode=artlist&maxrecords=10&format=rss&sort=datedesc" }
  ];

  try {
    const feedPromises = sources.map(async (source) => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 4000); 
        const res = await fetch(source.url, { 
          next: { revalidate: 60 },
          signal: controller.signal,
          headers: { "User-Agent": "Mozilla/5.0 (compatible; OverwatchMonitor/3.0;)" }
        });
        clearTimeout(timeoutId);
        if (!res.ok) return "";
        const text = await res.text();
        const items = text.match(/<item>[\s\S]*?<\/item>/g) || [];
        
        return items.slice(0, 12).map(item => {
          const titleMatch = item.match(/<title>(.*?)<\/title>/);
          const title = titleMatch ? titleMatch[1].replace(" - GDELT Project", "").replace(/<!\[CDATA\[|\]\]>/g, "") : "Report";
          return `[SRC: ${source.name}] ${title}`;
        }).join("\n");
      } catch (e) { return ""; }
    });
    const results = await Promise.all(feedPromises);
    return results.filter(r => r.length > 0).join("\n");
  } catch (e) { return null; }
}

export async function POST(req: Request) {
  try {
    const apiKey = process.env.DEEPSEEK_API_KEY;
    if (!apiKey) return NextResponse.json({ error: "Missing API Key" }, { status: 500 });

    const client = new OpenAI({ baseURL: 'https://api.deepseek.com', apiKey: apiKey });
    const rawIntel = await fetchOSINT();
    
    const systemPrompt = `You are an elite Military Intelligence AI. Analyze the live raw intel feed and output strictly JSON.
    
    CRITICAL RULES:
    1. SITUATION REPORT: Write a concise, 2-3 sentence strategic summary explaining the major global flashpoints.
    2. EXACT LOCATIONS: Extract the specific targets mentioned (e.g. "Fifth Fleet Bahrain", "Al Udeid Qatar", "Nevatim Airbase").

    JSON SCHEMA REQUIREMENT:
    {
      "situation_report": "Your 2-3 sentence strategic summary.",
      "kinetic_events": [
        {
          "title": "Headline",
          "description": "Brief summary",
          "exact_location_name": "Specific Facility or City (e.g., Al Asad Airbase)",
          "isMissile": true 
        }
      ]
    }`;
    
    const userContent = rawIntel 
      ? `LIVE INTEL FEED:\n${rawIntel}\n\nTASK: Provide a situation report and extract exact kinetic target names.` 
      : "Feed offline. Generate theoretical situation report.";

    const completion = await client.chat.completions.create({
      messages: [{ role: "system", content: systemPrompt }, { role: "user", content: userContent }],
      model: "deepseek-chat",
      temperature: 0.2, 
      response_format: { type: "json_object" }, 
    });

    const content = completion.choices[0].message.content || "{}";
    let parsedData: any = { situation_report: "", kinetic_events: [] };

    try {
      parsedData = JSON.parse(content);
      if (!parsedData.kinetic_events || !Array.isArray(parsedData.kinetic_events)) {
        parsedData.kinetic_events = [];
      }
    } catch (e) {}
    
    return NextResponse.json({ ...parsedData, rawFeed: rawIntel });

  } catch (e: any) {
    return NextResponse.json({ situation_report: "", kinetic_events: [], rawFeed: "" }, { status: 500 });
  }
}