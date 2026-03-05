"use client";

import React from 'react';
import { MapContainer, TileLayer, Marker, Polyline, Tooltip } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css'; // Turbopack handles this perfectly at the top level

// NEW: Added children prop (React.ReactNode) to accept nested components
export default function MapEngine({ 
  events = [], 
  trajectories = [], 
  children 
}: { 
  events: any[], 
  trajectories: any[], 
  children?: React.ReactNode 
}) {
  // Pinpoint accurate icon
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
        <Polyline key={`traj-${i}`} positions={[[t.startLat, t.startLng], [t.endLat, t.endLng]]} pathOptions={{ color: '#f97316', weight: 2, dashArray: '8, 8', opacity: 0.8 }} />
      ))}
      
      {events.map((e: any, i: number) => (
        <Marker key={`mark-${i}`} position={[e.lat, e.lng]} icon={createIcon()}>
          <Tooltip direction="top" className="!bg-slate-900 !text-cyan-400 !border !border-cyan-500/30 !font-mono !text-xs">
            [{e.isMissile ? "KINETIC" : "ALERT"}]
          </Tooltip>
        </Marker>
      ))}

      {/* NEW: Render the nested child layers here so they attach to the Leaflet map context */}
      {children}
      
    </MapContainer>
  );
}