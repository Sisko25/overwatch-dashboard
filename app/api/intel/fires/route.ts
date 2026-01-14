import { NextResponse } from 'next/server';
import Papa from 'papaparse';

// Global MODIS Feed
const FEED_URL = "https://firms.modaps.eosdis.nasa.gov/data/active_fire/modis-c6.1/csv/MODIS_C6_1_Global_24h.csv";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // 1. Fetch with a strict 3-second timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);

    const response = await fetch(FEED_URL, {
      signal: controller.signal,
      next: { revalidate: 300 }
    }).catch((err: any) => { // FIX 1: Type 'err' as any
      // Catch network errors (timeout/DNS) here
      throw new Error(`Network Failed: ${err?.message || 'Unknown Error'}`);
    });
    
    clearTimeout(timeoutId);

    if (!response.ok) throw new Error(`NASA Error: ${response.status}`);

    const csvText = await response.text();

    const results = Papa.parse(csvText, { header: true, skipEmptyLines: true });
    
    // Safety check: ensure we actually parsed rows
    // FIX 2: Check if results.data exists and is an array
    if (!results.data || !Array.isArray(results.data) || results.data.length === 0) {
      throw new Error("Empty CSV Data");
    }

    const fires = results.data.slice(0, 300).map((row: any) => ({
      id: `F-${row.latitude}-${row.longitude}`,
      lat: parseFloat(row.latitude),
      lng: parseFloat(row.longitude),
      brightness: parseFloat(row.brightness),
    })).filter((f: any) => !isNaN(f.lat) && !isNaN(f.lng));

    return NextResponse.json({ count: fires.length, fires, status: "LIVE" });

  } catch (error) {
    console.warn("⚠️ NASA Offline. Using Simulation.");
    
    // FIX 3: Explicitly type the array so TypeScript lets us push to it
    const simulatedFires: any[] = [];
    
    for(let i=0; i<40; i++) {
      simulatedFires.push({ 
        id: `sim-${i}`, 
        lat: -10 + Math.random() * 20, // Central Africa/Amazon Latitudes
        lng: 10 + Math.random() * 30, 
        brightness: 300 + Math.random() * 100 
      });
    }

    return NextResponse.json({ 
      count: simulatedFires.length, 
      fires: simulatedFires, 
      status: "SIMULATION" 
    });
  }
}