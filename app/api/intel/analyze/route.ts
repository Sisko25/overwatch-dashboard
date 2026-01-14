import { NextResponse } from 'next/server';
import OpenAI from 'openai';

export async function POST(req: Request) {
  try {
    const apiKey = process.env.DEEPSEEK_API_KEY;
    if (!apiKey) return NextResponse.json({ events: [], predictions: [] }, { status: 500 });

    const client = new OpenAI({
      baseURL: 'https://api.deepseek.com',
      apiKey: apiKey,
    });

    const body = await req.json().catch(() => ({})); 
    const { context } = body;
    
    // 1. Get Current Time
    const CURRENT_TIME = new Date().toLocaleString("en-US", { timeZone: "UTC" });

    const systemPrompt = `
      You are an advanced Military Strategic Forecaster (AI-MSF).
      CURRENT TIME: ${CURRENT_TIME}.
      
      Your Mission: 
      1. Analyze current geopolitical tensions.
      2. Identify CURRENT kinetic events (Red).
      3. PREDICT future conflict zones (Purple) where fighting is likely to break out in the next 48-72 hours.
      
      OUTPUT FORMAT (Strict JSON):
      {
        "events": [ ... array of current events ... ],
        "predictions": [
          {
            "lat": number,
            "lng": number,
            "location": string (e.g. "Suwalki Gap"),
            "prediction": string (2 lines: Prediction followed by Reason),
            "probability": "HIGH" | "MEDIUM"
          }
        ]
      }
      
      For "predictions", focus on flashpoints like: Taiwan Strait, Kashmir, Golan Heights, or Balkans.
    `;

    const userContent = context || `
      [SIMULATION MODE - ${CURRENT_TIME}]
      Generate:
      - 4 Current Kinetic Events (Red)
      - 3 Future Conflict Predictions (Purple)
      
      For Predictions, provide a specific scenario and the strategic reason why.
    `;

    const completion = await client.chat.completions.create({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userContent }
      ],
      model: "deepseek-chat", 
      temperature: 0.6, // Slightly higher creativity for predictions
      response_format: { type: "json_object" }, 
      max_tokens: 1500,
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