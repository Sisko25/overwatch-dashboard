"use client";

import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, Tooltip, CircleMarker } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// --- Animated Trajectory Engine ---
function AnimatedMissile({ startLat, startLng, endLat, endLng }: { startLat: number, startLng: number, endLat: number, endLng: number }) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let animationFrameId: number;
    const duration = 2000; // 2 seconds to reach the target
    const startTime = performance.now();

    const animate = (time: number) => {
      let t = (time - startTime) / duration;
      if (t > 1) t = t % 1; 
      
      setProgress(t);
      animationFrameId = requestAnimationFrame(animate);
    };

    animationFrameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrameId);
  }, []);

  const currentLat = startLat + (endLat - startLat) * progress;
  const currentLng = startLng + (endLng - startLng) * progress;

  return (
    <>
      <Polyline 
        positions={[[startLat, startLng], [endLat, endLng]]} 
        pathOptions={{ color: '#f97316', weight: 2, dashArray: '4, 8', opacity: 0.3 }} 
      />
      <CircleMarker 
        center={[currentLat, currentLng]} 
        radius={4} 
        pathOptions={{ color: '#ef4444', fillColor: '#ef4444', fillOpacity: 1, weight: 1 }} 
      />
    </>
  );
}

// --- MAIN MAP COMPONENT ---
export default function MapEngine({ 
  events = [], 
  trajectories = [], 
  children 
}: { 
  events: any[], 
  trajectories: any[], 
  children?: React.ReactNode 
}) {
  
  const createIcon = () => L.divIcon({
    className: 'custom-tactical-icon',
    html: `
      <div class="relative flex items-center justify-center w-6 h-6 -mt-3 -ml-3">
        <div class="absolute w-full h-full bg-red-500 rounded-full animate-ping opacity-20"></div>
        <div class="relative w-2 h-2 bg-red-600 border border-white/20 rounded-full shadow-[0_0_8px_#ff0000]"></div>
      </div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12], 
  });

  return (
    <MapContainer center={[30, 45]} zoom={4} zoomControl={false} style={{ width: "100%", height: "100%", backgroundColor: "#000" }}>
      <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
      
      {trajectories.map((t: any, i: number) => (
        <AnimatedMissile 
          key={`traj-${i}`} 
          // SWAPPED: Coordinates are reversed here to fix the directional bug
          // The visual origin now perfectly matches the correlation text
          startLat={t.endLat} 
          startLng={t.endLng} 
          endLat={t.startLat} 
          endLng={t.startLng} 
        />
      ))}
      
      {events.map((e: any, i: number) => (
        <Marker key={`mark-${i}`} position={[e.lat, e.lng]} icon={createIcon()}>
          <Tooltip direction="top" className="!bg-slate-900 !text-cyan-400 !border !border-cyan-500/30 !font-mono !text-xs">
            [{e.isMissile ? "KINETIC" : "ALERT"}]
          </Tooltip>
        </Marker>
      ))}

      {children}
      
    </MapContainer>
  );
}