"use client";

import dynamic from 'next/dynamic';

export interface AIEvent { 
  lat: number; 
  lng: number; 
  title: string; 
  isMissile?: boolean; 
}

// Dynamically load Leaflet, disabling Server Side Rendering (SSR)
const MapEngine = dynamic(() => import('./MapEngine'), { 
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-black">
      <div className="text-cyan-500 font-mono animate-pulse">INITIALIZING GEO-TRACKING...</div>
    </div>
  )
});

export default function TacticalMap({ 
  events, 
  missileTargets 
}: { 
  events: AIEvent[], 
  missileTargets: { startLat: number; startLng: number; endLat: number; endLng: number; }[] 
}) {
  return (
    <div className="absolute inset-0 z-0 bg-black overflow-hidden cursor-crosshair">
      <MapEngine events={events} missileTargets={missileTargets} />
    </div>
  );
}