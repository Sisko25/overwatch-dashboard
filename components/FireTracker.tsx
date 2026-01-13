"use client";

import { CircleMarker, Popup } from 'react-leaflet';
import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function FireTracker() {
  // Poll every 5 minutes (Data doesn't change fast)
  const { data } = useSWR('/api/intel/fires', fetcher, { refreshInterval: 300000 });

  if (!data?.fires) return null;

  return (
    <>
      {data.fires.map((fire: any, idx: number) => (
        <CircleMarker
          key={idx}
          center={[fire.lat, fire.lng]}
          pathOptions={{ 
            color: '#f59e0b',       // Amber Border
            fillColor: '#f59e0b',   // Amber Fill
            fillOpacity: 0.5, 
            weight: 1 
          }}
          radius={3} // Small dots
        >
          <Popup className="leaflet-popup-dark">
            <div className="text-xs font-mono bg-void text-amber p-1">
              <strong>THERMAL ANOMALY</strong>
              <div>INTENSITY: {fire.brightness}K</div>
              <div>COORDS: {fire.lat.toFixed(2)}, {fire.lng.toFixed(2)}</div>
            </div>
          </Popup>
        </CircleMarker>
      ))}
    </>
  );
}