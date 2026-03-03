"use client";

import { useState, useEffect } from 'react';

interface SatelliteProps {
  lat: number;
  lng: number;
  onClose: () => void;
}

export default function SatelliteTasker({ lat, lng, onClose }: SatelliteProps) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const sequence = [
      setTimeout(() => setStep(1), 1500),
      setTimeout(() => setStep(2), 3000),
      setTimeout(() => setStep(3), 4500),
    ];
    return () => sequence.forEach(clearTimeout);
  }, []);

  // ArcGIS World Imagery REST API URL for the specific target
  // We use a zoom level of 17 for high-res tactical detail
  const imageryUrl = `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/17/${Math.floor((1 - Math.log(Math.tan(lat * Math.PI / 180) + 1 / Math.cos(lat * Math.PI / 180)) / Math.PI) / 2 * Math.pow(2, 17))}/${Math.floor((lng + 180) / 360 * Math.pow(2, 17))}`;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm pointer-events-auto" onClick={onClose}>
      <div className="w-[600px] bg-black border border-cyan-500/50 p-6 shadow-[0_0_30px_rgba(6,182,212,0.3)] font-mono text-cyan-400 relative" onClick={(e) => e.stopPropagation()}>
        
        <button onClick={onClose} className="absolute top-2 right-4 text-cyan-700 hover:text-cyan-300 transition">✕ CANCEL</button>
        
        <div className="flex items-center gap-2 mb-4 border-b border-cyan-900 pb-2">
          <div className="w-3 h-3 bg-cyan-500 rounded-sm animate-pulse"></div>
          <h2 className="text-sm font-bold tracking-[0.3em] uppercase">ORBITAL SENSOR TASKING</h2>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* Text Console */}
          <div className="text-[10px] space-y-2">
            <div>&gt; TARGET COORDS: <span className="text-white">{lat.toFixed(4)}, {lng.toFixed(4)}</span></div>
            <div>&gt; SENSOR TYPE: <span className="text-white">SYNTHETIC APERTURE RADAR (SAR)</span></div>
            
            <div className={`transition-opacity duration-300 ${step >= 1 ? 'opacity-100' : 'opacity-0'}`}>
              &gt; ALIGNING LOW-EARTH ORBIT SATELLITE...
            </div>
            <div className={`transition-opacity duration-300 ${step >= 2 ? 'opacity-100 text-yellow-400' : 'opacity-0'}`}>
              &gt; PENETRATING CLOUD COVER...
            </div>
            <div className={`transition-opacity duration-300 ${step >= 3 ? 'opacity-100 text-green-400 font-bold' : 'opacity-0'}`}>
              &gt; IMAGE ACQUIRED. TRANSMITTING DOWNLINK.
            </div>
          </div>

          {/* Radar Visual */}
          <div className="h-40 bg-black border border-cyan-900 relative overflow-hidden flex items-center justify-center">
            {step < 3 ? (
               <div className="absolute inset-0 flex items-center justify-center bg-cyan-950/20">
                 <div className="w-32 h-32 border border-cyan-500/30 rounded-full"></div>
                 <div className="w-16 h-16 border border-cyan-500/50 rounded-full absolute animate-ping"></div>
                 <div className="w-[1px] h-full bg-cyan-500/50 absolute animate-spin" style={{ transformOrigin: 'center' }}></div>
               </div>
            ) : (
               <div className="w-full h-full relative group">
                 {/* 3D-COMPATIBLE IMAGE LAYER */}
                 <div 
                    className="absolute inset-0 bg-cover bg-center grayscale contrast-125 sepia hue-rotate-[180deg] saturate-200"
                    style={{ backgroundImage: `url('https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?auto=format&fit=crop&w=800&q=80')` }} 
                 >
                    {/* Inner Overlay for the 'Targeted' look */}
                    <div className="absolute inset-0 bg-cyan-900/20 mix-blend-overlay"></div>
                 </div>
                 
                 {/* Visual Overlays */}
                 <div className="absolute inset-0 bg-gradient-to-t from-cyan-900/50 to-transparent z-[1000] pointer-events-none"></div>
                 <div className="absolute inset-0 opacity-20 pointer-events-none z-[1000]" style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(6,182,212,1) 2px, rgba(6,182,212,1) 4px)' }}></div>
                 
                 <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 flex items-center justify-center z-[1000] pointer-events-none">
                    <div className="w-8 h-8 border border-red-500 rounded-full animate-ping opacity-50"></div>
                    <div className="w-2 h-2 bg-red-500 absolute rounded-full"></div>
                 </div>
                 
                 <span className="absolute bottom-2 right-2 text-[8px] text-cyan-400 bg-black/60 px-1 z-[1000]">SAR // BAND-C // LIVE</span>
               </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}