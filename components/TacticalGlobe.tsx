"use client";

import { useEffect, useState, useRef, useMemo } from 'react';
import dynamic from 'next/dynamic';

const Globe = dynamic(() => import('react-globe.gl'), { ssr: false });

interface Satellite {
  id: string;
  type: string;
  lat: number;
  lng: number;
  alt: number; 
}

export default function TacticalGlobe({ events, missileTargets }: { events: any[], missileTargets: any[] }) {
  const globeEl = useRef<any>(null);
  const [satellites, setSatellites] = useState<Satellite[]>([]);

  // THE ORBITAL ENGINE
  useEffect(() => {
    let animationFrameId: number;
    let start = Date.now();

    const updateSatellites = () => {
      const time = (Date.now() - start) / 15000; 
      setSatellites([
        { id: 'USA-224', type: 'KH-11', lat: Math.sin(time) * 45, lng: (time * 70) % 360 - 180, alt: 0.2 },
        { id: 'COSMOS-2542', type: 'INSPECTOR', lat: Math.cos(time + 1) * 60, lng: ((time + 1) * 60) % 360 - 180, alt: 0.3 },
        { id: 'ZHUHAI-1', type: 'HYPERSPECTRAL', lat: Math.sin(time + 2) * -30, lng: ((time + 2) * 80) % 360 - 180, alt: 0.15 },
        { id: 'USA-276', type: 'RADAR', lat: Math.cos(time + 3) * 70, lng: ((time + 3) * 50) % 360 - 180, alt: 0.25 },
      ]);
      animationFrameId = requestAnimationFrame(updateSatellites);
    };

    updateSatellites();
    return () => cancelAnimationFrame(animationFrameId);
  }, []);

  useEffect(() => {
    if (globeEl.current) {
      // Small timeout ensures the WebGL canvas is fully painted before manipulating controls
      setTimeout(() => {
        if (globeEl.current) {
           globeEl.current.controls().autoRotate = true;
           globeEl.current.controls().autoRotateSpeed = 0.5;
           globeEl.current.pointOfView({ lat: 30, lng: 45, altitude: 2.5 }); 
        }
      }, 100);
    }
  }, []);

  // Memoize the combined data to prevent aggressive re-renders of the HTML layers
  const htmlData = useMemo(() => [...events, ...satellites], [events, satellites]);

  return (
    <div className="absolute inset-0 z-0 bg-black cursor-crosshair">
      <Globe
        ref={globeEl}
        globeImageUrl="//unpkg.com/three-globe/example/img/earth-dark.jpg"
        backgroundColor="#000000"
        
        arcsData={missileTargets}
        arcStartLat={(d: any) => d.lat + 10} 
        arcStartLng={(d: any) => d.lng + 10}
        arcEndLat={(d: any) => d.lat}
        arcEndLng={(d: any) => d.lng}
        arcColor={() => '#f97316'} 
        arcDashLength={0.4}
        arcDashAnimateTime={1000}
        arcStroke={1.5}

        htmlElementsData={htmlData}
        htmlElement={(d: any) => {
          // The fix: We must return a generic HTML wrapper div. 
          // react-globe.gl applies __data to THIS element.
          const el = document.createElement('div');
          // Add a generic class to prevent React from getting confused
          el.className = 'globe-html-marker'; 
          
          if (d.alt) {
            el.innerHTML = `
              <div class="pointer-events-none flex flex-col items-center group transition-transform hover:scale-150">
                <div class="text-[8px] font-mono text-cyan-400 bg-black/60 border border-cyan-500/30 px-1 mb-1 whitespace-nowrap">
                  ${d.id} [${d.type}]
                </div>
                <div class="w-1.5 h-1.5 bg-cyan-400 rounded-full shadow-[0_0_8px_#22d3ee]"></div>
                <div class="absolute top-2 w-[1px] h-20 bg-gradient-to-b from-cyan-400/50 to-transparent"></div>
              </div>
            `;
          } else if (d.isMissile) {
            el.innerHTML = `<div class="relative flex items-center justify-center w-6 h-6"><div class="absolute w-full h-full bg-orange-500 rounded-full animate-ping opacity-75"></div><div class="relative w-3 h-3 bg-orange-600 rounded-full border border-white shadow-[0_0_10px_#f97316]"></div></div>`;
          } else {
            el.innerHTML = `<div class="relative flex flex-col items-center justify-center w-8 h-12 -mt-6 pointer-events-auto cursor-pointer"><div class="animate-bounce flex flex-col items-center"><div class="w-4 h-6 bg-red-600 border border-red-900 shadow-[0_0_10px_#ef4444]" style="clip-path: polygon(50% 100%, 0 0, 100% 0);"></div><div class="w-1.5 h-1.5 bg-white rounded-full mt-1 shadow-[0_0_5px_#fff]"></div></div></div>`;
          }
          
          return el;
        }}
        htmlAltitude={(d: any) => d.alt || 0}
      />
    </div>
  );
}