"use client";

import { useEffect, useState, useRef, useMemo } from 'react';
import dynamic from 'next/dynamic';

const Globe = dynamic(() => import('react-globe.gl'), { ssr: false });

export default function TacticalGlobe({ events, missileTargets }: { events: any[], missileTargets: any[] }) {
  const globeEl = useRef<any>(null);
  const [satellites, setSatellites] = useState<any[]>([]);

  // THE ORBITAL ENGINE (Simple Array)
  useEffect(() => {
    let animationFrameId: number;
    let start = Date.now();

    const updateSatellites = () => {
      const time = (Date.now() - start) / 15000; 
      setSatellites([
        { id: 'USA-224', type: 'KH-11', lat: Math.sin(time) * 45, lng: (time * 70) % 360 - 180, alt: 0.2, isSatellite: true },
        { id: 'COSMOS-2542', type: 'INSPECTOR', lat: Math.cos(time + 1) * 60, lng: ((time + 1) * 60) % 360 - 180, alt: 0.3, isSatellite: true },
        { id: 'ZHUHAI-1', type: 'HYPERSPECTRAL', lat: Math.sin(time + 2) * -30, lng: ((time + 2) * 80) % 360 - 180, alt: 0.15, isSatellite: true }
      ]);
      animationFrameId = requestAnimationFrame(updateSatellites);
    };

    updateSatellites();
    return () => cancelAnimationFrame(animationFrameId);
  }, []);

  // GLOBE CONFIGURATION
  useEffect(() => {
    if (globeEl.current) {
      setTimeout(() => {
        if (globeEl.current) {
           // THIS FIXES THE CONSTANT SPINNING - Set autoRotate to false
           globeEl.current.controls().autoRotate = false;
           globeEl.current.pointOfView({ lat: 30, lng: 45, altitude: 2.0 }); 
        }
      }, 100);
    }
  }, []);

  // Combine events and satellites for rendering
  const htmlData = useMemo(() => {
     // Filter out any events that don't have valid coordinates to prevent crashes
     const validEvents = events.filter(e => typeof e.lat === 'number' && typeof e.lng === 'number' && !isNaN(e.lat) && !isNaN(e.lng));
     return [...validEvents, ...satellites];
  }, [events, satellites]);

  return (
    <div className="absolute inset-0 z-0 bg-black cursor-crosshair">
      <Globe
        ref={globeEl}
        globeImageUrl="//unpkg.com/three-globe/example/img/earth-dark.jpg"
        backgroundColor="#000000"
        
        arcsData={missileTargets}
        arcStartLat={(d: any) => d.lat + 5} 
        arcStartLng={(d: any) => d.lng + 5}
        arcEndLat={(d: any) => d.lat}
        arcEndLng={(d: any) => d.lng}
        arcColor={() => '#f97316'} 
        arcDashLength={0.4}
        arcDashAnimateTime={1000}
        arcStroke={1.5}

        htmlElementsData={htmlData}
        htmlElement={(d: any) => {
          const el = document.createElement('div');
          
          if (d.isSatellite) {
            // SATELLITE MARKER
            el.innerHTML = `
              <div class="pointer-events-none flex flex-col items-center">
                <div class="text-[8px] font-mono text-cyan-400 bg-black/80 border border-cyan-500/30 px-1 mb-1 whitespace-nowrap">
                  ${d.id} [${d.type}]
                </div>
                <div class="w-2 h-2 bg-cyan-400 rounded-full shadow-[0_0_8px_#22d3ee]"></div>
              </div>
            `;
          } else if (d.isMissile) {
            // MISSILE IMPACT MARKER
            el.innerHTML = `<div class="relative flex items-center justify-center w-6 h-6"><div class="absolute w-full h-full bg-orange-500 rounded-full animate-ping opacity-75"></div><div class="relative w-3 h-3 bg-orange-600 rounded-full border border-white shadow-[0_0_10px_#f97316]"></div></div>`;
          } else {
            // KINETIC EVENT MARKER (Clickable)
            el.style.cursor = 'pointer';
            el.style.pointerEvents = 'auto'; // Ensure it can be clicked
            el.innerHTML = `<div class="relative flex flex-col items-center justify-center w-8 h-12 -mt-6 hover:scale-110 transition-transform"><div class="animate-bounce flex flex-col items-center"><div class="w-4 h-6 bg-red-600 border border-red-900 shadow-[0_0_10px_#ef4444]" style="clip-path: polygon(50% 100%, 0 0, 100% 0);"></div><div class="w-1.5 h-1.5 bg-white rounded-full mt-1 shadow-[0_0_5px_#fff]"></div></div></div>`;
            
            // Re-attach the click event directly to the DOM element
            el.onclick = () => {
              console.log("Clicked Coordinates:", d.lat, d.lng);
              // You can expand this later to trigger the SatelliteTasker!
            };
          }
          
          return el;
        }}
        htmlAltitude={(d: any) => d.alt || 0}
      />
    </div>
  );
}