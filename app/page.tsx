"use client";

import { useState, useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';
import useSWR from 'swr';
import Image from 'next/image';
import { Activity, Globe } from 'lucide-react';
import LoadingScreen from '@/components/LoadingScreen';

// --- 1. DYNAMIC IMPORTS ---
const MapEngine = dynamic(() => import('@/components/MapEngine'), { 
  ssr: false,
  loading: () => <div className="h-full w-full bg-black flex items-center justify-center text-cyan-500 animate-pulse font-mono">INITIALIZING TACTICAL GRID...</div>
});

const DetectionPanel = dynamic(() => import('@/components/DetectionPanel'), { ssr: false });

// NEW: Map Layers & Overlays dynamically imported (ssr: false required for Leaflet)
const EWJammingLayer = dynamic(() => import('@/components/EWJammingLayer'), { ssr: false });
const OrbitalAssetsLayer = dynamic(() => import('@/components/OrbitalAssetsLayer'), { ssr: false });
const FlightTrackerLayer = dynamic(() => import('@/components/FlightTrackerLayer'), { ssr: false });
const SatelliteTasker = dynamic(() => import('@/components/SatelliteTasker'), { ssr: false });

// --- 2. CONSTANTS ---
const COUNTRY_MAP = [
  { name: "BAHRAIN", lat: 26.2062, lng: 50.6065, keywords: ["bahrain", "manama", "fifth fleet"] },
  { name: "QATAR", lat: 25.1184, lng: 51.3146, keywords: ["qatar", "doha", "al udeid"] },
  { name: "UAE", lat: 24.2483, lng: 54.5475, keywords: ["uae", "emirates", "dubai", "abu dhabi"] },
  { name: "KUWAIT", lat: 29.3475, lng: 47.5211, keywords: ["kuwait", "arifjan"] },
  { name: "SAUDI ARABIA", lat: 24.0622, lng: 47.5385, keywords: ["saudi", "riyadh", "ksa"] },
  { name: "IRAN", lat: 35.6892, lng: 51.3890, keywords: ["iran", "tehran", "isfahan", "natanz"] },
  { name: "ISRAEL", lat: 31.0461, lng: 34.8516, keywords: ["israel", "tel aviv", "jerusalem", "haifa"] },
  { name: "YEMEN", lat: 15.3694, lng: 44.1910, keywords: ["yemen", "sanaa", "houthi"] },
  { name: "SYRIA", lat: 33.5138, lng: 36.2765, keywords: ["syria", "damascus"] },
  { name: "IRAQ", lat: 33.3152, lng: 44.3661, keywords: ["iraq", "baghdad", "erbil"] },
  { name: "JORDAN", lat: 31.9454, lng: 35.9284, keywords: ["jordan", "amman"] }
];

const DEFENSE_STOCKS = [
  { symbol: "RTX", name: "Raytheon", price: "124.52", change: "+1.2%" },
  { symbol: "LMT", name: "Lockheed", price: "452.10", change: "+0.8%" },
  { symbol: "NOC", name: "Northrop", price: "482.34", change: "-0.2%" },
  { symbol: "GD", name: "Gen Dynamics", price: "294.15", change: "+0.5%" }
];

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function OverwatchDashboard() {
  const [isBooting, setIsBooting] = useState(true);
  const [accumulatedIntel, setAccumulatedIntel] = useState<any[]>([]); 
  const [trajectories, setTrajectories] = useState<any[]>([]);
  const [threats, setThreats] = useState<any[]>([]);
  const [sitrep, setSitrep] = useState<string>("AWAITING INITIALIZATION...");
  const [defcon, setDefcon] = useState(5);
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);
  const [isNoradActive, setIsNoradActive] = useState(false);
  
  // NEW: State to trigger the Satellite Tasker overlay
  const [satelliteTarget, setSatelliteTarget] = useState<{lat: number, lng: number} | null>(null);

  const { data: kineticData } = useSWR('/api/intel/kinetic', fetcher, { refreshInterval: 15000 });

  useEffect(() => {
    const timer = setTimeout(() => setIsBooting(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const criticalCount = accumulatedIntel.filter(i => i.isCritical || i.type === 'CRITICAL').length;
    if (criticalCount > 15 || threats.length > 0) setDefcon(2);
    else if (criticalCount > 5) setDefcon(3);
    else setDefcon(5);
  }, [accumulatedIntel, threats]);

  const activeMarkers = useMemo(() => {
    const markers: any[] = [];
    accumulatedIntel.forEach(item => {
      const text = item.title.toLowerCase();
      COUNTRY_MAP.forEach(country => {
        if (country.keywords.some(kw => text.includes(kw)) && !markers.find(m => m.lat === country.lat)) {
          markers.push({ lat: country.lat, lng: country.lng, isMissile: text.includes('missile'), title: country.name });
        }
      });
    });
    return markers;
  }, [accumulatedIntel]);

  useEffect(() => {
    if (kineticData?.data) {
      setAccumulatedIntel(prev => {
        const combined = [...kineticData.data, ...prev];
        return Array.from(new Map(combined.map(item => [item.title, item])).values()).slice(0, 50);
      });
    }
  }, [kineticData]);

  const runAnalysis = async () => {
    setLoadingAnalysis(true);
    setIsNoradActive(false);
    try {
      const res = await fetch('/api/intel/analyze', { method: 'POST' });
      const data = await res.json();
      setSitrep(data.situation_report || "ANALYSIS OFFLINE");
      setTrajectories(data.missileTargets || []);
      setThreats(data.detected_launches || []);
      if (data.detected_launches?.some((t: any) => t.alert_level === 'CRITICAL')) setIsNoradActive(true);
    } catch (e) { console.error(e); } finally { setLoadingAnalysis(false); }
  };

  if (isBooting) return <LoadingScreen />;

  return (
    <main className={`relative w-screen h-screen bg-black overflow-hidden font-mono ${isNoradActive ? 'norad-active' : ''}`}>
      
      {/* 1. MAP BACKGROUND WITH NEW LAYERS */}
      <div className="absolute inset-0 z-0">
        <MapEngine events={activeMarkers} trajectories={trajectories}>
          <EWJammingLayer />
          <OrbitalAssetsLayer />
          <FlightTrackerLayer />
        </MapEngine>
      </div>

      {/* 2. THE CORRELATION PANEL */}
      <DetectionPanel threats={threats} />

      {/* 3. HEADER */}
      <header className="absolute top-0 left-0 right-0 z-[100] flex items-center justify-between px-6 py-2 bg-black/80 border-b border-cyan-500/30 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <div className="relative w-12 h-12">
            <Image src="/sgcoat.svg" alt="Singapore Coat of Arms" fill className="object-contain" priority />
          </div>
          <h1 className="text-2xl font-bold tracking-widest text-white">OVERWATCH</h1>
        </div>
        <div className="flex items-center gap-6">
          <div className={`text-2xl font-bold p-2 border border-cyan-900/30 rounded ${defcon <= 3 ? 'text-red-500 animate-pulse' : 'text-cyan-400'}`}>DEFCON {defcon}</div>
          <button onClick={runAnalysis} className="bg-cyan-500/10 border border-cyan-500/50 text-cyan-400 px-4 py-2 text-[10px] uppercase font-bold hover:bg-cyan-900/50 transition-colors">
            {loadingAnalysis ? "WORKING..." : "Run Analysis"}
          </button>
        </div>
      </header>

      {/* 4. LEFT SIDEBAR (SITREP) */}
      <aside className="absolute left-4 top-24 w-80 z-50 bg-black/90 border border-cyan-500/30 p-4 shadow-2xl flex flex-col max-h-[calc(100vh-160px)]">
        <h2 className="text-[10px] text-cyan-400 font-bold mb-3 border-b border-cyan-500/20 pb-1 uppercase tracking-widest">Strategic Sitrep</h2>
        
        {/* Restored static text/analysis feed */}
        <p className="text-[11px] text-cyan-100/80 leading-relaxed italic mb-6">{sitrep}</p>

        <h2 className="text-[10px] text-cyan-400 font-bold mb-3 border-b border-cyan-500/20 pb-1 uppercase tracking-widest mt-auto">Tactical Pointers ({activeMarkers.length})</h2>
        <div className="space-y-2 overflow-y-auto custom-scrollbar flex-1 min-h-[100px]">
          {activeMarkers.map((m, i) => (
            <div key={i} className="flex justify-between items-center p-1 border border-transparent hover:border-cyan-900/30 transition-colors">
              <div className={`text-[10px] font-bold ${m.isMissile ? 'text-red-500' : 'text-cyan-400'}`}>● {m.isMissile ? 'MISSILE ALERT: ' : 'POINTER: '}{m.title}</div>
              
              {/* NEW: Button to trigger the Satellite Tasker for this target's coordinates */}
              <button 
                onClick={() => setSatelliteTarget({ lat: m.lat, lng: m.lng })}
                className="text-[8px] bg-cyan-950/50 text-cyan-400 px-2 py-1 border border-cyan-800 hover:bg-cyan-500 hover:text-black transition-colors uppercase font-bold tracking-wider"
              >
                TASK SAR
              </button>
            </div>
          ))}
        </div>
      </aside>

      {/* 5. RIGHT SIDEBAR (OSINT FEED) */}
      <aside className="absolute right-4 top-24 bottom-16 w-96 z-50 bg-black/80 border border-white/10 backdrop-blur-sm flex flex-col shadow-2xl">
        <div className="p-3 border-b border-white/10 flex justify-between items-center bg-white/5 uppercase">
          <h2 className="text-xs font-bold text-cyan-400 tracking-widest flex items-center gap-2"><Activity size={14}/> Datalink Intercepts</h2>
          <span className="text-[10px] bg-red-600 text-white px-2 py-0.5 font-bold animate-pulse">{accumulatedIntel.filter(i => i.isCritical).length} ACTIVE</span>
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
          {accumulatedIntel.map((item, idx) => (
            <div key={idx} className={`p-3 border-l-2 ${item.type === 'CRITICAL' || item.isCritical ? 'border-red-600 bg-red-950/10' : 'border-cyan-600 bg-cyan-950/10'}`}>
              <div className="flex justify-between text-[8px] text-slate-500 mb-1 font-bold uppercase">
                <span>{item.intelClass || 'OSINT'}</span>
                <span>{new Date(item.timestamp).toLocaleTimeString()}</span>
              </div>
              <p className="text-[10px] text-cyan-100 leading-tight">{item.title}</p>
            </div>
          ))}
        </div>
      </aside>

      {/* 6. FOOTER (TICKER) */}
      <footer className="absolute bottom-0 left-0 right-0 h-10 bg-black/90 border-t border-cyan-500/20 z-[100] flex items-center px-6 text-[9px] font-mono backdrop-blur-md overflow-hidden">
        <div className="flex items-center gap-2 text-cyan-700 tracking-widest whitespace-nowrap border-r border-white/10 pr-6 mr-6 uppercase">
          <Globe size={12} className="text-cyan-500" /> [SG] :: Republic of Singapore ::
        </div>
        <div className="flex items-center gap-8 animate-ticker whitespace-nowrap">
          {DEFENSE_STOCKS.map((stock, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="text-slate-500 uppercase">{stock.name}</span>
              <span className="text-white font-bold">{stock.symbol}</span>
              <span className="text-cyan-400">${stock.price}</span>
              <span className={stock.change.startsWith('+') ? 'text-green-500' : 'text-red-500'}>{stock.change}</span>
            </div>
          ))}
        </div>
      </footer>

      {/* 7. OVERLAYS */}
      {satelliteTarget && (
        <SatelliteTasker 
          lat={satelliteTarget.lat} 
          lng={satelliteTarget.lng} 
          onClose={() => setSatelliteTarget(null)} 
        />
      )}

      <style jsx>{`
        @keyframes ticker { 0% { transform: translateX(10%); } 100% { transform: translateX(-100%); } }
        .animate-ticker { animation: ticker 30s linear infinite; }
      `}</style>
    </main>
  );
}