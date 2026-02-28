"use client";

import { MapContainer, TileLayer, ZoomControl } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useEffect } from "react";

// Trackers

import FireTracker from "./FireTracker";
import EventTracker from "./EventTracker";
import ISSTracker from "./ISSTracker"; 
import TacticalLayer from "./TacticalLayer"; // <--- IMPORT THIS
import EWJammingLayer from '@/components/EWJammingLayer';
import OrbitalAssetsLayer from '@/components/OrbitalAssetsLayer';
import CyberThreatLayer from '@/components/CyberThreatLayer';
import FlightTrackerLayer from './FlightTrackerLayer';

// --- LEAFLET ICON FIX ---
const iconFix = () => {
  // @ts-ignore
  delete L.Icon.Default.prototype._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  });
};

export default function Map({ children }: { children?: React.ReactNode }) {
  
  useEffect(() => {
    iconFix();
  }, []);

  return (
    <div className="relative w-full h-screen z-0">
      {/* Sci-Fi Grid Overlay */}
      <div className="absolute inset-0 pointer-events-none z-[1000] bg-grid-overlay bg-[size:40px_40px] opacity-10"></div>
      
      <MapContainer 
        center={[20, 10]} 
        zoom={3} 
        scrollWheelZoom={true} 
        zoomControl={false}
        className="w-full h-full bg-void"
      >
        <TileLayer
          attribution='&copy; <a href="https://carto.com/">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />
        
        {/* Standard Layers */}
        
        <FireTracker />
        <EventTracker />
        <ISSTracker />
        <EWJammingLayer /> 
        <OrbitalAssetsLayer /> 
        <CyberThreatLayer />
        <FlightTrackerLayer />
        
        {/* New Military Base Data */}
        <TacticalLayer /> 

        {/* VVV RENDER CHILDREN HERE (AIAnalystLayer) VVV */}
        {children}
        
        <ZoomControl position="bottomright" />
      </MapContainer>
    </div>
  );
}