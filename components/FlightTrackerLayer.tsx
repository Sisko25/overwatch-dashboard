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
  const aircraftRef = useRef<Aircraft[]>([]); // Ref to hold data for the high-frequency animation loop

  // 1. DATA FETCHING LOOP (Pulls new positions every 10s)
  useEffect(() => {
    const fetchMilitary = async () => {
      try {
        const res = await fetch('https://api.airplanes.live/v2/mil');
        if (!res.ok) throw new Error("Offline");
        const data = await res.json();
        
        // Filter and clean the data
        const livePlanes = data.ac
          .filter((p: any) => p.lat && p.lon)
          .map((p: any) => ({
            hex: p.hex,
            flight: (p.flight || p.hex).trim(),
            lat: parseFloat(p.lat),
            lon: parseFloat(p.lon),
            alt_baro: p.alt_baro || 0,
            track: parseFloat(p.track || 0),
            gs: parseFloat(p.gs || 250), // Fallback speed to 250kts if not provided
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

  // 2. THE 60FPS SMOOTH GLIDE ENGINE (Dead Reckoning)
  useEffect(() => {
    let lastTimestamp = 0;

    const animate = (timestamp: number) => {
      if (!lastTimestamp) lastTimestamp = timestamp;
      const deltaTime = (timestamp - lastTimestamp) / 1000; // time in seconds
      lastTimestamp = timestamp;

      // Update positions based on Ground Speed and Heading
      const updated = aircraftRef.current.map(plane => {
        // Distance = Speed * Time. (Knots to Degrees approx: 1kt = 0.0000005 deg/sec)
        const speedFactor = (plane.gs || 250) * 0.0000005;
        const headingRad = (plane.track - 90) * (Math.PI / 180); // Adjusting for 0 deg being North
        
        return {
          ...plane,
          lat: plane.lat - Math.sin(headingRad) * speedFactor,
          lon: plane.lon + Math.cos(headingRad) * speedFactor
        };
      });

      aircraftRef.current = updated;
      setAircraft(updated);
      requestAnimationFrame(animate);
    };

    const animationId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationId);
  }, []);

  return (
    <>
      {aircraft.map((plane) => {
        if (isNaN(plane.lat) || isNaN(plane.lon)) return null;

        const color = "#06b6d4"; // NATO Cyan
        
        const planeIcon = L.divIcon({
          className: 'bg-transparent',
          html: `
            <div style="transform: rotate(${plane.track}deg);" class="w-6 h-6 flex items-center justify-center transition-all duration-500">
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
              <div className="bg-black text-cyan-400 p-2 font-mono text-[10px]">
                <div className="font-bold border-b border-cyan-900 mb-1">LIVE TACTICAL TRACK</div>
                <div>CALLSIGN: {plane.flight}</div>
                <div>ALTITUDE: {plane.alt_baro} FT</div>
                <div>SPEED: {plane.gs} KTS</div>
              </div>
            </Popup>
          </Marker>
        );
      })}
    </>
  );
}