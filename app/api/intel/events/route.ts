import { NextResponse } from 'next/server';

// GDACS GeoJSON Feed (Earthquakes, Floods, Cyclones)
const GDACS_FEED = "https://www.gdacs.org/gdacsapi/api/events/geteventlist/SEARCH?eventlist=EQ,TC,FL,VO,DR,WF";

export async function GET() {
  try {
    const response = await fetch(GDACS_FEED, { next: { revalidate: 3600 } }); // Cache for 1 hour
    const data = await response.json();

    // Map to clean format
    const events = data.features.map((e: any) => ({
      id: e.properties.eventid,
      name: e.properties.name,
      type: e.properties.eventtype, // EQ (Quake), TC (Cyclone), FL (Flood)
      level: e.properties.alertlevel, // Green, Orange, Red
      lat: e.geometry.coordinates[1],
      lng: e.geometry.coordinates[0],
      date: e.properties.fromdate
    }));

    return NextResponse.json({ count: events.length, events });
  } catch (error) {
    return NextResponse.json({ error: "GDACS Uplink Failed" }, { status: 500 });
  }
}