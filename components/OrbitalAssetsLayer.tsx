"use client";

import { useState, useEffect } from 'react';
import { Marker, Polyline, Popup, LayerGroup } from 'react-leaflet';
import L from 'leaflet';

interface Satellite {
  id: string;
  name: string;
  type: string;
  country: string;
  lat: number;
  lng: number;
  phase: number; 
}

const INITIAL_SATELLITES: Satellite[] = [
  { id: "sat-1", name: "USA-314 (NRO KEYHOLE)", type: "OPTICAL RECON", country: "UNITED STATES", lat: 0, lng: -120, phase: 0 },
  { id: "sat-2", name: "KOSMOS 2558", type: "INSPECTOR / ASAT", country: "RUSSIA", lat: 0, lng: 45, phase: Math.PI / 4 },
  { id: "sat-3", name: "YAOGAN-35", type: "SIGINT / ELINT", country: "CHINA", lat: 0, lng: 110, phase: Math.PI / 2 },
];

export default function OrbitalAssetsLayer() {
  const [satellites, setSatellites] = useState<Satellite[]>(INITIAL_SATELLITES);

  useEffect(() => {
    const interval = setInterval(() => {
      setSatellites(prev => prev.map(sat => {
        const newLng = sat.lng + 0.5; 
        const newPhase = sat.phase + 0.02;
        const newLat = Math.sin(newPhase) * 55; 
        
        return {
          ...sat,
          lng: newLng > 180 ? -180 : newLng, 
          lat: newLat,
          phase: newPhase
        };
      }));
    }, 1000); 

    return () => clearInterval(interval);
  }, []);

  if (satellites.length === 0) return null;

  return (
    <LayerGroup>
      {satellites.map((sat) => {
        const trajectory: [number, number][] = [];
        for (let i = -20; i <= 20; i++) {
          const l = sat.lng + (i * 2);
          const p = sat.phase + (i * 0.08);
          trajectory.push([Math.sin(p) * 55, l]);
        }

        const satIcon = L.divIcon({
          className: 'bg-transparent',
          html: `
            <div class="relative flex items-center justify-center w-8 h-8 group">
              <svg viewBox="0 0 24 24" fill="none" stroke="#a855f7" stroke-width="1.5" class="drop-shadow-[0_0_5px_rgba(168,85,247,0.8)] z-10">
                <path d="M12 21V19M12 5V3M3 12H5M19 12H21M6.5 6.5L8 8M16 16L17.5 17.5M6.5 17.5L8 16M16 8L17.5 6.5" stroke-linecap="round"/>
                <circle cx="12" cy="12" r="3" fill="rgba(168,85,247,0.4)" />
              </svg>
              <div class="absolute top-8 text-[7px] text-purple-400 font-mono whitespace-nowrap bg-black/60 px-1 border border-purple-500/30 opacity-0 group-hover:opacity-100 transition-opacity">
                ${sat.name}
              </div>
            </div>
          `,
          iconSize: [32, 32],
          iconAnchor: [16, 16],
        });

        return (
          <div key={sat.id}>
            <Polyline positions={trajectory} pathOptions={{ color: '#a855f7', weight: 1, dashArray: '4, 8', opacity: 0.4 }} />
            <Marker position={[sat.lat, sat.lng]} icon={satIcon}>
              <Popup>
                <div className="bg-black text-purple-300 p-2 text-xs font-mono border border-purple-500/50 min-w-[200px]">
                  <div className="font-bold border-b border-purple-500/30 mb-1 pb-1 text-purple-400">ORBITAL ASSET DETECTED</div>
                  <strong>DESIGNATION:</strong> {sat.name}<br/>
                  <strong>OPERATOR:</strong> {sat.country}<br/>
                  <strong>MISSION:</strong> {sat.type}<br/>
                  <strong>ALTITUDE:</strong> LEO (Low Earth Orbit)<br/>
                  <div className="mt-2 text-[9px] text-purple-500 animate-pulse">LAT: {sat.lat.toFixed(2)} | LNG: {sat.lng.toFixed(2)}</div>
                </div>
              </Popup>
            </Marker>
          </div>
        );
      })}
    </LayerGroup>
  );
}