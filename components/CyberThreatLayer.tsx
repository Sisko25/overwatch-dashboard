"use client";

import { CircleMarker, Popup, LayerGroup } from 'react-leaflet';

// MOCK DATA: Simulating NetBlocks / Cloudflare Radar real-time outage APIs
const CYBER_OUTAGES = [
  { id: "cyb-1", lat: 35.6892, lng: 51.3890, target: "TEHRAN TELECOM", type: "BGP ROUTE DROP / STATE BLACKOUT", severity: "CRITICAL", drop: "87%", status: "OFFLINE" },
  { id: "cyb-2", lat: 44.6166, lng: 33.5254, target: "CRIMEA SUBSEA CABLE", type: "PHYSICAL SEVER / MASS DDOS", severity: "SEVERE", drop: "100%", status: "OFFLINE" },
  { id: "cyb-3", lat: 31.5017, lng: 34.4668, target: "GAZA ISP GATEWAY", type: "TOTAL GRID BLACKOUT", severity: "CRITICAL", drop: "99%", status: "OFFLINE" },
  { id: "cyb-4", lat: 25.0330, lng: 121.5654, target: "TAIPEI FINANCIAL NET", type: "STATE-SPONSORED DDOS", severity: "ELEVATED", drop: "14%", status: "DEGRADED" },
];

export default function CyberThreatLayer() {
  return (
    <LayerGroup>
      {CYBER_OUTAGES.map((outage) => {
        const isCritical = outage.severity === "CRITICAL";
        const color = isCritical ? "#ec4899" : "#eab308"; // Neon Pink/Magenta for Cyber Critical, Yellow for Degraded

        return (
          <div key={outage.id}>
            {/* The Outer Glitch Pulse */}
            <CircleMarker
              center={[outage.lat, outage.lng]}
              radius={20}
              pathOptions={{ color: 'transparent', fillColor: color, fillOpacity: 0.2, className: 'animate-ping' }}
            />
            {/* The Core Marker */}
            <CircleMarker
              center={[outage.lat, outage.lng]}
              radius={8}
              pathOptions={{ color: color, weight: 2, fillColor: '#000', fillOpacity: 0.8 }}
            >
              <Popup>
                <div className="bg-black p-3 text-xs font-mono min-w-[220px] border" style={{ borderColor: color, color: color, textShadow: `0 0 5px ${color}` }}>
                  <div className="flex items-center gap-2 mb-2 border-b pb-1" style={{ borderColor: color }}>
                    <div className="w-2 h-2 animate-pulse bg-current"></div>
                    <strong className="tracking-widest">CYBERSECURITY ALERT</strong>
                  </div>
                  
                  <div className="space-y-1.5 mt-2 text-white/90" style={{ textShadow: "none" }}>
                    <div><span className="text-gray-500">TARGET:</span> {outage.target}</div>
                    <div><span className="text-gray-500">VECTOR:</span> <span className="font-bold">{outage.type}</span></div>
                    <div><span className="text-gray-500">CONNECTIVITY DROP:</span> <span className="font-bold text-red-500">{outage.drop}</span></div>
                    
                    <div className="mt-2 pt-2 border-t border-white/10 flex justify-between items-center">
                       <span className="text-[9px] text-gray-500">NETWORK STATUS:</span>
                       <span className="text-[10px] font-black animate-pulse" style={{ color: color }}>[{outage.status}]</span>
                    </div>
                  </div>
                </div>
              </Popup>
            </CircleMarker>
          </div>
        );
      })}
    </LayerGroup>
  );
}