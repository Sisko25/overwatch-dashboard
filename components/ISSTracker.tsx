"use client";

import { useState, useEffect } from 'react';
import { Marker, Polyline, Popup, Tooltip } from 'react-leaflet';
import L from 'leaflet';
import * as satellite from 'satellite.js';
import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then(res => res.json());

// Custom ISS Icon
const issIcon = L.divIcon({
  className: 'bg-transparent',
  html: `
    <div class="relative flex items-center justify-center w-8 h-8">
      <div class="absolute w-full h-full border border-matrix rounded-full animate-ping opacity-20"></div>
      <div class="w-2 h-2 bg-white rounded-full shadow-[0_0_10px_#fff]"></div>
      <svg class="absolute w-8 h-8 text-matrix" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <path d="M2 12h20M12 2v20M4.93 4.93l14.14 14.14M19.07 4.93L4.93 19.07" opacity="0.5"/>
      </svg>
    </div>
  `,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

export default function ISSTracker() {
  const { data: tle } = useSWR('/api/intel/orbit', fetcher);
  const [position, setPosition] = useState<[number, number] | null>(null);
  const [trajectory, setTrajectory] = useState<[number, number][]>([]);

  useEffect(() => {
    if (!tle?.line1 || !tle?.line2) return;

    // 1. Initialize Satrec (Satellite Record)
    const satrec = satellite.twoline2satrec(tle.line1, tle.line2);

    const updatePosition = () => {
      const now = new Date();
      
      // 2. Propagate Orbit for "Now"
      const positionAndVelocity = satellite.propagate(satrec, now);
      const positionEci = positionAndVelocity.position as satellite.EciVec3<number>;

      if (positionEci) {
        const gmst = satellite.gstime(now);
        const positionGd = satellite.eciToGeodetic(positionEci, gmst);
        
        const lat = satellite.degreesLat(positionGd.latitude);
        const lng = satellite.degreesLong(positionGd.longitude);
        
        setPosition([lat, lng]);
      }
    };

    // 3. Calculate Trajectory (Next 90 mins / 1 full orbit)
    const futurePath: [number, number][] = [];
    const now = new Date();
    for (let i = 0; i < 90; i++) {
      const futureDate = new Date(now.getTime() + i * 60000); // Add i minutes
      const posVel = satellite.propagate(satrec, futureDate);
      const posEci = posVel.position as satellite.EciVec3<number>;
      
      if (posEci) {
        const gmst = satellite.gstime(futureDate);
        const posGd = satellite.eciToGeodetic(posEci, gmst);
        const lat = satellite.degreesLat(posGd.latitude);
        const lng = satellite.degreesLong(posGd.longitude);
        futurePath.push([lat, lng]);
      }
    }
    setTrajectory(futurePath);

    // 4. Start Real-time Loop
    const timer = setInterval(updatePosition, 1000); // Update every second
    updatePosition(); // Initial call

    return () => clearInterval(timer);
  }, [tle]);

  if (!position) return null;

  return (
    <>
      {/* Trajectory Line */}
      <Polyline 
        positions={trajectory} 
        pathOptions={{ color: '#ffffff', weight: 1, opacity: 0.3, dashArray: '4, 8' }} 
      />
      
      {/* ISS Marker */}
      <Marker position={position} icon={issIcon} zIndexOffset={1000}>
        <Tooltip direction="top" offset={[0, -10]} opacity={1} permanent className="leaflet-tooltip-tech">
          ISS [ORBITAL]
        </Tooltip>
        <Popup className="leaflet-popup-dark">
          <div className="text-xs font-mono bg-void text-white p-1">
            <strong className="text-matrix">STATION ALPHA</strong>
            <div>ALT: 420 KM</div>
            <div>VEL: 27,600 KM/H</div>
          </div>
        </Popup>
      </Marker>
    </>
  );
}