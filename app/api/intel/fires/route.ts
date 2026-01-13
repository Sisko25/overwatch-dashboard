import { NextResponse } from 'next/server';
import Papa from 'papaparse';

// We use the Global feed as a fallback if the regional one fails
const FEED_AFRICA = "https://firms.modaps.eosdis.nasa.gov/data/active_fire/noaa-20-viirs-c2/csv/J1_VIIRS_C2_Africa_24h.csv";

export const dynamic = 'force-dynamic'; // Prevent caching issues

export async function GET() {
  try {
    // 1. Fetch with "User-Agent" to bypass NASA Bot Protection
    const response = await fetch(FEED_AFRICA, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      },
      next: { revalidate: 300 } 
    });

    if (!response.ok) {
      console.error(`NASA API Error: ${response.status} ${response.statusText}`);
      throw new Error('NASA Uplink Refused');
    }

    const csvText = await response.text();

    return new Promise((resolve) => {
      Papa.parse(csvText, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          const fires = results.data
            .slice(0, 1000)
            .map((row: any) => ({
              id: `${row.latitude}-${row.longitude}`,
              lat: parseFloat(row.latitude),
              lng: parseFloat(row.longitude),
              brightness: parseFloat(row.bright_ti4 || row.brightness), // Handle different CSV headers
            }))
            // Strict Filter: Remove invalid points that cause crashes
            .filter((f: any) => !isNaN(f.lat) && !isNaN(f.lng));

          resolve(NextResponse.json({ count: fires.length, fires }));
        },
        error: (err: any) => {
          console.error("CSV Parse Error:", err);
          resolve(NextResponse.json({ count: 0, fires: [] })); // Return empty instead of crashing
        }
      });
    });

  } catch (error) {
    console.error("Thermal Route Failed:", error);
    // Return empty data (Safety Mode) so the map still loads other layers
    return NextResponse.json({ count: 0, fires: [], status: "Offline" });
  }
}