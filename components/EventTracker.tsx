"use client";

import { CircleMarker, Popup } from 'react-leaflet';
import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then(res => res.json());

// Color coding for alert levels
const getColor = (level: string) => {
  if (level === 'Red') return '#ef4444';   // Crimson
  if (level === 'Orange') return '#f59e0b'; // Amber
  return '#00ff9d'; // Matrix Green (Low threat)
};

export default function EventTracker() {
  const { data } = useSWR('/api/intel/events', fetcher);

  if (!data?.events) return null;

  return (
    <>
      {data.events.map((ev: any) => (
        <CircleMarker
          key={ev.id}
          center={[ev.lat, ev.lng]}
          pathOptions={{ 
            color: getColor(ev.level), 
            fillColor: 'transparent', 
            weight: 2,
            dashArray: '5, 5' // Dashed line for "Warning Zone" look
          }}
          radius={20} // Large radius
        >
          <Popup className="leaflet-popup-dark">
            <div className="text-xs font-mono bg-void text-white p-1">
              <strong style={{ color: getColor(ev.level) }}>{ev.type}: {ev.name}</strong>
              <div className="opacity-70">LEVEL: {ev.level}</div>
              <div className="opacity-70">{new Date(ev.date).toLocaleDateString()}</div>
            </div>
          </Popup>
        </CircleMarker>
      ))}
    </>
  );
}