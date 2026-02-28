"use client";

import { Circle, Popup, LayerGroup } from 'react-leaflet';

const JAMMING_ZONES = [
  { id: "ew-1", name: "BALTIC SEA ANOMALY", lat: 54.7, lng: 20.5, radius: 250000, severity: "CRITICAL", source: "KALININGRAD OBLAST" },
  { id: "ew-2", name: "LEVANT SPOOFING", lat: 33.5, lng: 35.5, radius: 150000, severity: "SEVERE", source: "NORTHERN ISRAEL / LEBANON" },
  { id: "ew-3", name: "BLACK SEA DENIAL", lat: 44.5, lng: 34.0, radius: 300000, severity: "CRITICAL", source: "CRIMEA PENINSULA" },
  { id: "ew-4", name: "STRAIT OF HORMUZ", lat: 26.5, lng: 56.2, radius: 100000, severity: "MODERATE", source: "IRANIAN COASTLINE" },
];

export default function EWJammingLayer() {
  return (
    <LayerGroup>
      {JAMMING_ZONES.map((zone) => (
        <Circle
          key={zone.id}
          center={[zone.lat, zone.lng]}
          radius={zone.radius}
          pathOptions={{
            color: zone.severity === "CRITICAL" ? '#ef4444' : '#f59e0b',
            fillColor: zone.severity === "CRITICAL" ? '#ef4444' : '#f59e0b',
            fillOpacity: 0.15,
            dashArray: '10, 15', 
            weight: 2,
          }}
        >
          <Circle
            center={[zone.lat, zone.lng]}
            radius={zone.radius * 0.4}
            pathOptions={{ color: 'transparent', fillColor: '#ef4444', fillOpacity: 0.3, className: 'animate-ping' }}
          />
          <Popup>
            <div className="bg-black text-orange-400 p-2 text-xs font-mono border border-orange-500/50 min-w-[200px]">
              <div className="flex items-center gap-2 mb-2 border-b border-orange-500/30 pb-1">
                <div className="w-2 h-2 bg-orange-500 animate-pulse"></div>
                <strong className="tracking-widest">EW // GPS INTERFERENCE</strong>
              </div>
              <div className="space-y-1">
                <div><span className="text-gray-500">ZONE:</span> {zone.name}</div>
                <div><span className="text-gray-500">EST. SOURCE:</span> {zone.source}</div>
                <div>
                  <span className="text-gray-500">DEGRADATION:</span> 
                  <span className={zone.severity === "CRITICAL" ? "text-red-500 font-bold" : "text-yellow-500 font-bold"}>
                    {zone.severity}
                  </span>
                </div>
              </div>
            </div>
          </Popup>
        </Circle>
      ))}
    </LayerGroup>
  );
}