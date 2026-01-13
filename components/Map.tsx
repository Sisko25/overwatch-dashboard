"use client";

import { MapContainer, TileLayer, ZoomControl } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

import AircraftTracker from "./AircraftTracker";
import FireTracker from "./FireTracker";
import EventTracker from "./EventTracker";
// VVV IMPORT ISS VVV
import ISSTracker from "./ISSTracker"; 

// ... (Keep existing Icon Fix Code) ...

export default function Map() {
  return (
    <div className="relative w-full h-screen z-0">
      <div className="absolute inset-0 pointer-events-none z-[1000] bg-grid-overlay bg-[size:40px_40px] opacity-10"></div>
      
      <MapContainer 
        center={[0, 0]} // Center on Equator for global view
        zoom={2} 
        scrollWheelZoom={true} 
        zoomControl={false}
        className="w-full h-full bg-void"
      >
        <TileLayer
          attribution='&copy; CARTO'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />
        
        <AircraftTracker />
        <FireTracker />
        <EventTracker />
        {/* VVV LAUNCH SATELLITE VVV */}
        <ISSTracker />
        
        <ZoomControl position="bottomright" />
      </MapContainer>
    </div>
  );
}