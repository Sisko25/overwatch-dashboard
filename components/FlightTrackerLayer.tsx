"use client";

import { useState, useEffect, useRef } from 'react';
import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';

interface Aircraft {
  hex: string;
  flight: string;
  lat: number;
  lon: number;
  alt_baro: number | string;
  track: number; 
  gs: number; // Ground Speed
  t: string; 
  desc: string; 
}

export default function FlightTrackerLayer() {
  const [aircraft, setAircraft] = useState<Aircraft[]>([]);
  const aircraftRef = useRef<Aircraft[]>([]);

  // 1. DATA FETCHING LOOP (Pulls new positions every 10s)
  useEffect(() => {
    const fetchMilitary = async () => {
      try {
        const res = await fetch('https://api.airplanes.live/v2/mil');
        if (!res.ok) throw new Error("Offline");
        const data = await res.json();
        
        const livePlanes = data.ac
          .filter((p: any) => p.lat && p.lon)
          .map((p: any) => ({
            hex: p.hex,
            flight: (p.flight || p.hex).trim(),
            lat: parseFloat(p.lat),
            lon: parseFloat(p.lon),
            alt_baro: p.alt_baro || 0,
            track: parseFloat(p.track || 0),
            gs: parseFloat(p.gs || 250), 
            t: p.t || "",
            desc: p.desc || ""
          }));

        setAircraft(livePlanes);
        aircraftRef.current = livePlanes;
      } catch (e) {
        console.log("ADS-B Fetch Failed - Waiting for retry");
      }
    };

    fetchMilitary();
    const interval = setInterval(fetchMilitary, 10000);
    return () => clearInterval(interval);
  }, []);

  // 2. THE DEAD RECKONING ENGINE (Fixed for Clickability & Accurate Speed)
  useEffect(() => {
    const intervalId = setInterval(() => {
      const updated = aircraftRef.current.map(plane => {
        // Distance = Speed * Time. 
        // We are updating every 1000ms (1 sec), so Time multiplier is 1.
        const speedFactor = (plane.gs || 250) * 0.0000005; 
        const headingRad = (plane.track - 90) * (Math.PI / 180); 
        
        return {
          ...plane,
          lat: plane.lat - Math.sin(headingRad) * speedFactor,
          lon: plane.lon + Math.cos(headingRad) * speedFactor
        };
      });

      aircraftRef.current = updated;
      setAircraft(updated);
    }, 1000); // Ticks every 1 second instead of 60FPS

    return () => clearInterval(intervalId);
  }, []);

  return (
    <>
      {aircraft.map((plane) => {
        if (isNaN(plane.lat) || isNaN(plane.lon)) return null;

        const color = "#06b6d4"; // NATO Cyan
        
        const planeIcon = L.divIcon({
          className: 'bg-transparent',
          html: `
            <div style="transform: rotate(${plane.track}deg);" class="w-6 h-6 flex items-center justify-center transition-transform duration-1000">
              <svg viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" class="drop-shadow-[0_0_3px_${color}]">
                 <path d="M12 2L12 12M12 12L16 20M12 12L8 20" stroke-linecap="round"/>
                 <polygon points="12,2 14,10 22,12 14,14 12,22 10,14 2,12 10,10" fill="${color}" fill-opacity="0.2"/>
              </svg>
            </div>
          `,
          iconSize: [24, 24],
          iconAnchor: [12, 12],
        });

        return (
          <Marker 
            key={plane.hex} 
            position={[plane.lat, plane.lon]} 
            icon={planeIcon}
          >
            <Popup>
              <div className="bg-black text-cyan-400 p-2 font-mono text-[10px] border border-cyan-500/50 shadow-lg min-w-[150px]">
                <div className="font-bold border-b border-cyan-900 mb-2 pb-1 text-white">TACTICAL TRACK</div>
                <div className="grid grid-cols-2 gap-1">
                  <span className="text-cyan-700">CALLSIGN:</span> <span>{plane.flight}</span>
                  <span className="text-cyan-700">ALTITUDE:</span> <span>{plane.alt_baro} FT</span>
                  <span className="text-cyan-700">SPEED:</span> <span>{plane.gs} KTS</span>
                  <span className="text-cyan-700">HEADING:</span> <span>{plane.track}°</span>
                </div>
              </div>
            </Popup>
          </Marker>
        );
      })}
    </>
  );
}