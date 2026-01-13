"use client";

import { useEffect } from 'react';
import { useMap, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import useSWR from 'swr';

// 1. Define the Custom "Fighter Jet" Icon
const createJetIcon = (rotation: number) => {
  return L.divIcon({
    className: 'bg-transparent',
    html: `
      <div style="transform: rotate(${rotation}deg); width: 24px; height: 24px;">
        <svg viewBox="0 0 24 24" fill="none" stroke="#00ff9d" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 2L2 22l10-3 10 3L12 2z" fill="rgba(0, 255, 157, 0.2)" />
        </svg>
      </div>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 12], // Center of the rotation
  });
};

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function AircraftTracker() {
  const map = useMap();
  
  // Poll every 60 seconds (OpenSky Limit)
  const { data } = useSWR('/api/intel/aircraft', fetcher, { 
    refreshInterval: 60000 
  });

  return (
    <>
      {data?.flights?.map((flight: any) => (
        <Marker
          key={flight.id}
          position={[flight.latitude, flight.longitude]}
          icon={createJetIcon(flight.rotation)}
        >
          <Popup className="leaflet-popup-dark">
            <div className="text-xs font-mono bg-void text-matrix p-1">
              <strong className="block text-amber">{flight.callsign || "UNKNOWN"}</strong>
              <div>ORG: {flight.country}</div>
              <div>SPD: {Math.round(flight.velocity * 3.6)} km/h</div>
            </div>
          </Popup>
        </Marker>
      ))}
    </>
  );
}