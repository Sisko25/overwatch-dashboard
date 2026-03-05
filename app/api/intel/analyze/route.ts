import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// 1. THE NEWS DATALINK
async function fetchHighTrustOSINT() {
  const query = encodeURIComponent('(Iran OR Israel OR Houthi OR Hezbollah) (strike OR missile OR attack OR drone) (site:reuters.com OR site:timesofisrael.com OR site:tehrantimes.com) when:1d');
  const url = `https://news.google.com/rss/search?q=${query}&hl=en-US&gl=US&ceid=US:en`;
  try {
    const res = await fetch(url, { next: { revalidate: 60 } });
    if (!res.ok) return "";
    const text = await res.text();
    const items = text.match(/<item>[\s\S]*?<\/item>/g) || [];
    return items.slice(0, 15).map(item => {
      const titleMatch = item.match(/<title[^>]*>(.*?)<\/title>/);
      return titleMatch ? titleMatch[1].replace(/<!\[CDATA\[(.*?)\]\]>/g, "$1") : "";
    }).join("\n");
  } catch (e) { return ""; }
}

// 2. THE FLIGHT DATA DATALINK (The Bridge)
async function fetchADSBData() {
  const apiKey = process.env.ADSB_EXCHANGE_API_KEY;
  
  // If you don't have the $100/mo API key, inject simulated transponder data for the AI to read
  if (!apiKey) {
    return `[SIMULATED ADSB FEED - MIDDLE EAST BOUNDING BOX]
    - Callsign: AE0414 | Type: KC-135 Stratotanker | Status: Loitering over Qatar
    - Callsign: AE0137 | Type: KC-135 Stratotanker | Status: Loitering over UAE
    - Callsign: ZZ664  | Type: RC-135W Rivet Joint (EW/Recon) | Status: Patrolling Eastern Med`;
  }

  // Production ADSB code (Requires Premium API)
  try {
    const res = await fetch(`https://adsbexchange.com/api/aircraft/v2/lat/30/lon/45/dist/1000/`, {
      headers: { 'api-auth': apiKey }
    });
    const data = await res.json();
    return data.ac.filter((a: any) => a.mil === 1).map((a: any) => 
      `- Callsign: ${a.flight} | Type: ${a.t} | Status: Active at ${a.alt_baro}ft`
    ).join("\n");
  } catch (e) { return "ADSB LINK OFFLINE"; }
}

export async function POST(req: Request) {
  let cleanText = "{}";

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return NextResponse.json({ error: "Missing API Key" }, { status: 500 });

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ 
        model: "gemini-2.5-pro", 
        generationConfig: { responseMimeType: "application/json", temperature: 0.1 }
    });

    // Run both intelligence sweeps simultaneously for speed
    const [rawNews, rawADSB] = await Promise.all([fetchHighTrustOSINT(), fetchADSBData()]);

    const systemPrompt = `You are a Military Early Warning AI. 
    Analyze the WIRE FEED and the ADSB FLIGHT DATA to correlate threats.
    Do NOT invent data. If ADSB shows reconnaissance/refueling planes active at the same time the Wire Feed reports impending strikes, elevate the probability score.

    SCHEMA:
    {
      "situation_report": "Brief strategic summary.",
      "kinetic_events": [{ "title": "Headline", "lat": 0, "lng": 0, "isMissile": true }],
      "trajectories": [{ "startLat": 0, "startLng": 0, "endLat": 0, "endLng": 0 }],
      "detected_launches": [
        {
          "id": "THREAT-1",
          "origin": "Country/Region",
          "target": "Country/Region",
          "alert_level": "CRITICAL", 
          "threat_type": "Potential Coordinated Strike",
          "probability_score": 85,
          "reasoning": "Explain the correlation between the ADSB plane movements and the news reports."
        }
      ]
    }`;
    
    const combinedData = `WIRE FEED:\n${rawNews}\n\nADSB FLIGHT DATA:\n${rawADSB}`;

    const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: systemPrompt + "\n\n" + combinedData }] }]
    });

    cleanText = (result.response.text() || "{}").replace(/```json\n?/g, '').replace(/```/g, '').trim();
    const parsedData = JSON.parse(cleanText);
    
    return NextResponse.json({ 
        situation_report: parsedData.situation_report || "", 
        kinetic_events: parsedData.kinetic_events || [],
        missileTargets: parsedData.trajectories || [],
        detected_launches: parsedData.detected_launches || [], // The new correlation array
        rawFeed: combinedData // Passing combined data to frontend for transparency
    });

  } catch (e: any) {
    console.error("Gemini Error:", e.message);
    return NextResponse.json({ situation_report: "ANALYSIS ERROR", kinetic_events: [], missileTargets: [], detected_launches: [] }, { status: 500 });
  }
}