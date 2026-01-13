import { NextResponse } from 'next/server';

// Official ISS TLE Source
const TLE_URL = 'https://celestrak.org/NORAD/elements/gp.php?CATNR=25544&FORMAT=TLE';

export async function GET() {
  try {
    const response = await fetch(TLE_URL, { next: { revalidate: 3600 } }); // Cache for 1 hour
    const text = await response.text();
    const lines = text.split('\n');

    // Return the clean 2 lines of data
    return NextResponse.json({
      line1: lines[1].trim(),
      line2: lines[2].trim()
    });
  } catch (error) {
    return NextResponse.json({ error: "Uplink Failed" }, { status: 500 });
  }
}