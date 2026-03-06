"use client";

import { useState, useEffect } from 'react';
import Image from 'next/image';

const BOOT_LOGS = [
  "INITIALIZING SECURE KERNEL...",
  "ESTABLISHING HANDSHAKE WITH [SG] DEFNET...",
  "BYPASSING GEO-RESTRICTIONS...",
  "UPLINK SATELLITE: USA-314 (NRO) DETECTED",
  "DECRYPTING OSINT DATALINKS...",
  "MOUNTING TACTICAL GRID OVERLAYS...",
  "CALIBRATING ORBITAL SENSORS...",
  "SYNCING GLOBAL KINETIC EVENTS...",
  "SYSTEM OPTIMAL. READY FOR DEPLOYMENT."
];

export default function LoadingScreen() {
  const [progress, setProgress] = useState(0);
  const [logIndex, setLogIndex] = useState(0);

  useEffect(() => {
    // Simulated chaotic loading progress for realism
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        const jump = Math.floor(Math.random() * 12) + 2; 
        return Math.min(prev + jump, 100);
      });
    }, 250);

    return () => clearInterval(progressInterval);
  }, []);

  useEffect(() => {
    // Map the progress to the text logs
    const mappedIndex = Math.min(
      Math.floor((progress / 100) * BOOT_LOGS.length),
      BOOT_LOGS.length - 1
    );
    setLogIndex(mappedIndex);
  }, [progress]);

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-black font-mono overflow-hidden">
      
      {/* Background grid & vignette for monitor effect */}
      <div className="absolute inset-0 z-0 opacity-20 pointer-events-none" style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(6,182,212,0.3) 2px, rgba(6,182,212,0.3) 4px)', backgroundSize: '100% 4px' }}></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,black_80%)] z-10 pointer-events-none"></div>

      {/* Main UI Container */}
      <div className="z-20 flex flex-col items-center w-full max-w-2xl px-6">
        
        {/* Radar & Crest */}
        <div className="relative flex items-center justify-center mb-8">
          {/* Animated rings */}
          <div className="absolute w-48 h-48 border border-cyan-900 rounded-full animate-[spin_10s_linear_infinite]"></div>
          <div className="absolute w-40 h-40 border border-cyan-500/30 border-t-cyan-400 rounded-full animate-spin"></div>
          <div className="absolute w-32 h-32 border border-cyan-500/10 rounded-full"></div>
          
          {/* Crosshairs */}
          <div className="absolute w-56 h-[1px] bg-cyan-900/50"></div>
          <div className="absolute h-56 w-[1px] bg-cyan-900/50"></div>

          <div className="relative w-20 h-20 animate-pulse drop-shadow-[0_0_15px_rgba(6,182,212,0.8)]">
            <Image 
              src="/sgcoat.svg" 
              alt="Singapore Coat of Arms" 
              fill
              className="object-contain"
              priority
            />
          </div>
        </div>

        {/* Title */}
        <div className="flex flex-col items-center mb-10">
          <h1 className="text-4xl md:text-5xl font-bold tracking-[0.3em] text-white drop-shadow-[0_0_10px_rgba(6,182,212,0.6)]">
            OVERWATCH
          </h1>
          <div className="text-cyan-500 text-[10px] tracking-[0.5em] mt-2 uppercase border-t border-cyan-900/50 pt-2 w-full text-center">
            Republic of Singapore // Strategic Command
          </div>
        </div>

        {/* Progress Bar Container */}
        <div className="w-full mb-4">
          <div className="flex justify-between text-cyan-400 text-xs mb-2 font-bold tracking-widest">
            <span>SYSTEM BOOT</span>
            <span>{progress}%</span>
          </div>
          <div className="h-1.5 w-full bg-cyan-950/50 rounded-sm overflow-hidden border border-cyan-900/50 relative">
            <div 
              className="h-full bg-cyan-400 shadow-[0_0_10px_#22d3ee] transition-all duration-200 ease-out"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>

        {/* Terminal Log Output */}
        <div className="w-full h-24 bg-black/50 border border-cyan-900/50 p-3 flex flex-col justify-end text-[10px] sm:text-xs overflow-hidden relative">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-black via-transparent to-transparent z-10 pointer-events-none"></div>
          
          <div className="space-y-1 z-0 relative flex flex-col justify-end">
            {BOOT_LOGS.slice(0, logIndex + 1).map((log, i) => (
              <div 
                key={i} 
                className={`${i === logIndex ? 'text-cyan-300 font-bold opacity-100 animate-pulse' : 'text-cyan-700 opacity-50'}`}
              >
                <span className="mr-2 text-cyan-500">&gt;</span>
                {log}
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}