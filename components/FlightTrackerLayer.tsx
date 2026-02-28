"use client";

import { useState, useEffect } from 'react';
import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';

interface Aircraft {
  hex: string;
  flight: string;
  lat: number;
  lon: number;
  alt_baro: number;
  track: number;
  t: string;
  desc: string;
}

// OSINT SIMULATION: Pre-loaded NATO & Strategic assets
const MOCK_FLIGHTS: Aircraft[] = [
  { hex: "AE01C5", flight: "FORTE10", lat: 42.1, lon: 32.2, alt_baro: 51000, track: 85, t: "RQ4", desc: "USAF Global Hawk" },
  { hex: "4DB001", flight: "HOMER31", lat: 33.9, lon: 35.5, alt_baro: 32000, track: 180, t: "RC135", desc: "USAF Rivet Joint" },
  { hex: "43C39C", flight: "NATO01", lat: 48.1, lon: 22.0, alt_baro: 31000, track: 270, t: "E3TF", desc: "NATO AWACS" },
  { hex: "154242", flight: "RCH871", lat: 24.5, lon: 120.0, alt_baro: 35000, track: 45, t: "RC135", desc: "USAF Recon" },
  { hex: "7321AF", flight: "IAF09", lat: 31.5, lon: 34.5, alt_baro: 24000, track: 10, t: "F35", desc: "ISR Air Force" },
  { hex: "8989FA", flight: "PLAAF1", lat: 22.5, lon: 118.0, alt_baro: 28000, track: 210, t: "J20", desc: "PLA Air Force" },
  { hex: "AF2911", flight: "RR-01", lat: 26.1, lon: 51.2, alt_baro: 38000, track: 130, t: "P8", desc: "USN Poseidon" } // Added Gulf patrol
];

export default function FlightTrackerLayer() {
  // 1. START WITH MOCK DATA INSTANTLY SO MAP IS NEVER EMPTY
  const [aircraft, setAircraft] = useState<Aircraft[]>(MOCK_FLIGHTS);

  useEffect(() => {
    const fetchMilPlanes = async () => {
      try {
        // 2. STRICT 4-SECOND TIMEOUT SO IT DOESNT HANG (Prevents ETIMEDOUT freezes)
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 4000);

        const res = await fetch('https://api.adsb.lol/v2/mil', { signal: controller.signal });
        clearTimeout(timeoutId);

        if (!res.ok) throw new Error("API Blocked or Offline");
        const data = await res.json();
        
        const activePlanes = data.ac.filter((p: any) => p.lat && p.lon);
        if (activePlanes.length > 0) {
          setAircraft(activePlanes);
        } else {
          throw new Error("No live planes, reverting to tactical sim");
        }
      } catch (e) {
        // 3. IF API FAILS, ANIMATE THE MOCK PLANES
        setAircraft(prev => prev.map(f => {
          // Calculate movement based on heading
          const rad = (f.track - 90) * (Math.PI / 180);
          const speedFactor = 0.05; 
          return {
            ...f, 
            lat: f.lat + Math.sin(rad) * speedFactor, 
            lon: f.lon + Math.cos(rad) * speedFactor
          };
        }));
      }
    };

    // Run immediately, then every 5 seconds
    fetchMilPlanes();
    const interval = setInterval(fetchMilPlanes, 5000);
    return () => clearInterval(interval);
  }, []);

  if (aircraft.length === 0) return null;

  return (
    <>
      {aircraft.map((plane) => {
        const isUSorNATO = plane.desc?.includes("USAF") || plane.desc?.includes("NATO") || plane.desc?.includes("USN");
        // Cyan for friendly/NATO, Purple for Unknown/Adversary
        const color = isUSorNATO ? "#06b6d4" : "#a855f7"; 
        
        const planeIcon = L.divIcon({
          className: 'bg-transparent',
          html: `
            <div style="transform: rotate(${plane.track || 0}deg);" class="w-6 h-6 flex items-center justify-center">
              <svg viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="1.5" class="drop-shadow-[0_0_5px_${color}]">
                 <path d="M12 2L12 12M12 12L16 20M12 12L8 20" stroke-linecap="round" stroke-linejoin="round"/>
                 <polygon points="12,2 14,10 22,12 14,14 12,22 10,14 2,12 10,10" fill="${color}" fill-opacity="0.3"/>
              </svg>
            </div>
            <div class="absolute top-6 left-6 text-[8px] font-mono whitespace-nowrap bg-black/80 px-1 border" style="color: ${color}; border-color: ${color}50;">
              ${plane.flight || plane.hex}
            </div>
          `,
          iconSize: [24, 24],
          iconAnchor: [12, 12],
        });

        return (
          <Marker key={plane.hex} position={[plane.lat, plane.lon]} icon={planeIcon}>
            <Popup>
              <div className="bg-black p-2 text-xs font-mono min-w-[160px] border" style={{ color: color, borderColor: `${color}80` }}>
                <div className="font-bold border-b mb-1 pb-1 flex items-center gap-2" style={{ borderColor: `${color}50` }}>
                  <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: color }}></div>
                  SIGINT INTERCEPT
                </div>
                <div className="text-white">
                  <span className="text-gray-500">CALLSIGN:</span> {plane.flight || "UNKNOWN"}<br/>
                  <span className="text-gray-500">ASSET:</span> {plane.t || plane.desc || "CLASSIFIED"}<br/>
                  <span className="text-gray-500">ALTITUDE:</span> {plane.alt_baro ? `${plane.alt_baro} ft` : "N/A"}<br/>
                  <span className="text-gray-500">HEADING:</span> {plane.track}&deg;
                </div>
              </div>
            </Popup>
          </Marker>
        );
      })}
    </>
  );
}