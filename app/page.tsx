"use client";

import dynamic from 'next/dynamic';
import useSWR from 'swr';
import { AlertTriangle, Activity, Globe, Radio } from 'lucide-react';
import { useState, useEffect } from 'react';
import Image from 'next/image';
// VVV IMPORT THE NEW COMPONENT VVV
import LoadingScreen from '@/components/LoadingScreen';

// Map loading state (appears inside the map container)
const MapComponent = dynamic(() => import('@/components/Map'), { 
  ssr: false,
  loading: () => <div className="h-full w-full bg-void flex items-center justify-center text-matrix animate-pulse font-mono tracking-widest">INITIALIZING MAP DATA...</div>
});

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function OverwatchDashboard() {
  // VVV NEW LOADING STATE VVV
  const [isLoading, setIsLoading] = useState(true);
  const { data: kineticData } = useSWR('/api/intel/kinetic', fetcher, { refreshInterval: 60000 });
  const [defcon, setDefcon] = useState(5);
  const [criticalEvents, setCriticalEvents] = useState(0);

  useEffect(() => {
    // SIMULATE LOADING TIME (e.g., 3 seconds for a cool effect)
    // In a real app, you might wait for data, but this looks better.
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (kineticData?.data) {
      const criticalCount = kineticData.data.filter((i: any) => i.type === "CRITICAL").length;
      setCriticalEvents(criticalCount);
      if (criticalCount > 5) setDefcon(3);
      else if (criticalCount > 10) setDefcon(2);
      else setDefcon(4);
    }
  }, [kineticData]);

  // VVV SHOW LOADING SCREEN FIRST VVV
  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <main className="relative min-h-screen bg-void overflow-hidden text-matrix selection:bg-matrix selection:text-void">
      <div className="absolute inset-0 z-0"><MapComponent /></div>
      
      {/* Header with LARGER Image */}
      <header className="absolute top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-1 bg-slate/90 backdrop-blur-xl border-b-2 border-matrix/50 shadow-[0_5px_15px_rgba(0,0,0,0.5)]">
        
        <div className="flex items-center gap-4 h-full">
          {/* VVV INCREASED SIZE TO w-14 h-14 VVV */}
          <div className="relative w-14 h-14 my-1">
            <Image 
              src="/sgcoat.svg" 
              alt="Singapore Coat of Arms" 
              fill
              className="object-contain drop-shadow-[0_0_8px_rgba(255,255,255,0.6)]"
              priority
            />
          </div>

          <h1 className="text-3xl font-bold tracking-[0.2em] text-white drop-shadow-[0_0_5px_#00ff9d]">OVERWATCH</h1>
          <span className="flex items-center gap-2 text-xs border border-matrix px-3 py-1.5 bg-matrix/10 rounded-sm font-mono">
            <Radio size={14} className="animate-pulse text-matrix" /> SYSTEM ONLINE
          </span>
        </div>

        <div className="flex items-center gap-6 font-mono">
           <div className="text-center p-2 bg-slate/50 rounded-sm border border-matrix/20">
             <span className="text-[10px] text-slate-400 block mb-1 tracking-wider">THREAT LEVEL</span>
             <div className={`text-2xl font-bold ${defcon <= 3 ? 'text-crimson animate-pulse drop-shadow-[0_0_8px_rgba(239,68,68,0.8)]' : 'text-matrix drop-shadow-[0_0_5px_#00ff9d]'}`}>DEFCON {defcon}</div>
          </div>
        </div>
      </header>

      {/* Aside and Footer remain unchanged... */}
      <aside className="absolute right-0 top-20 bottom-0 w-80 md:w-96 bg-void/95 border-l-2 border-matrix/30 backdrop-blur-md z-40 flex flex-col shadow-[-5px_0_15px_rgba(0,0,0,0.5)]">
        <div className="p-4 border-b-2 border-matrix/30 flex items-center justify-between bg-slate/80">
          <h2 className="font-bold flex items-center gap-3 text-sm tracking-wider"><Activity size={18} className="text-matrix" /> KINETIC FEED</h2>
          <span className="text-xs text-void bg-crimson px-2 py-1 rounded-sm font-bold animate-pulse">{criticalEvents} ALERTS</span>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-matrix/50 scrollbar-track-void">
          {!kineticData ? (<div className="flex flex-col items-center justify-center h-full opacity-50 space-y-4">
            <div className="w-8 h-8 border-2 border-matrix border-t-transparent rounded-full animate-spin"></div>
            <div className="text-xs font-mono tracking-widest">SCANNING DATALINKS...</div>
          </div>) : (
            kineticData.data.map((item: any, idx: number) => (
              <div key={idx} className={`p-3 border-l-[3px] text-xs font-mono relative group transition-all duration-300 hover:bg-slate/60 hover:translate-x-1 ${item.type === 'CRITICAL' ? 'border-crimson bg-crimson/10' : 'border-matrix bg-matrix/10'}`}>
                <div className="flex justify-between text-[10px] opacity-70 mb-1 tracking-wider">
                  <span className="uppercase text-matrix">{item.source}</span>
                  <span>{new Date(item.timestamp).toLocaleTimeString()}</span>
                </div>
                <a href={item.link} target="_blank" rel="noreferrer" className="hover:text-white hover:underline block leading-relaxed">{item.title}</a>
                {item.type === 'CRITICAL' && (<AlertTriangle className="absolute top-3 right-3 text-crimson opacity-0 group-hover:opacity-100 transition-opacity animate-pulse" size={16} />)}
              </div>
            ))
          )}
        </div>
      </aside>
      <footer className="absolute bottom-0 left-0 right-80 md:right-96 h-8 bg-slate/90 border-t border-matrix/50 z-40 flex items-center px-6 backdrop-blur-md">
        <div className="flex items-center gap-2 text-[10px] font-mono opacity-70 tracking-widest uppercase"><Globe size={12} /> Global Monitoring Active // Secure Connection</div>
      </footer>
    </main>
  );
}