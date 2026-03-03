"use client";

import { useState, useEffect, useMemo } from 'react';
import WarMonitor from './WarMonitor'; 
import SatelliteTasker from './SatelliteTasker';
import TacticalGlobe from './TacticalGlobe'; // <-- IMPORTING THE 3D GLOBE

// --- 1. DIRECT COUNTRY & BASE MAPPER ---
const COUNTRY_MAP = [
  { name: "BAHRAIN", lat: 26.2062, lng: 50.6065, keywords: ["bahrain", "manama", "fifth fleet", "nsa bahrain"] },
  { name: "QATAR", lat: 25.1184, lng: 51.3146, keywords: ["qatar", "doha", "al udeid"] },
  { name: "UAE", lat: 24.2483, lng: 54.5475, keywords: ["uae", "emirates", "dubai", "abu dhabi", "al dhafra"] },
  { name: "KUWAIT", lat: 29.3475, lng: 47.5211, keywords: ["kuwait", "ali al salem", "arifjan"] },
  { name: "SAUDI ARABIA", lat: 24.0622, lng: 47.5385, keywords: ["saudi", "riyadh", "prince sultan", "ksa"] },
  { name: "OMAN", lat: 21.4735, lng: 55.9754, keywords: ["oman", "muscat"] },
  { name: "IRAN", lat: 35.6892, lng: 51.3890, keywords: ["iran", "tehran", "tabriz", "isfahan", "karaj", "bushehr", "natanz", "bandar abbas"] },
  { name: "ISRAEL", lat: 31.0461, lng: 34.8516, keywords: ["israel", "tel aviv", "jerusalem", "haifa", "nevatim", "ramat david"] },
  { name: "GAZA / WEST BANK", lat: 31.5017, lng: 34.4668, keywords: ["gaza", "rafah", "west bank"] },
  { name: "LEBANON", lat: 33.8547, lng: 35.8623, keywords: ["lebanon", "beirut", "hezbollah"] },
  { name: "YEMEN", lat: 15.3694, lng: 44.1910, keywords: ["yemen", "sanaa", "houthi", "hodeidah", "sana'a"] },
  { name: "SYRIA", lat: 33.5138, lng: 36.2765, keywords: ["syria", "damascus", "hmeimim", "aleppo"] },
  { name: "IRAQ", lat: 33.3152, lng: 44.3661, keywords: ["iraq", "baghdad", "al asad", "erbil", "jurf"] },
  { name: "PAKISTAN", lat: 33.6844, lng: 73.0479, keywords: ["pakistan", "islamabad", "khyber", "balochistan"] },
  { name: "AFGHANISTAN", lat: 34.5553, lng: 69.2075, keywords: ["afghanistan", "kabul"] },
  { name: "JORDAN", lat: 31.9454, lng: 35.9284, keywords: ["jordan", "amman"] },
  { name: "USA", lat: 38.9072, lng: -77.0369, keywords: ["usa", "united states"] } 
];

const MACRO_GULF_KEYWORDS = ["gulf", "us bases", "u.s. bases", "arab states", "middle east"];
const GULF_COUNTRIES_TO_TRIGGER = ["BAHRAIN", "QATAR", "UAE", "KUWAIT", "SAUDI ARABIA"];

interface AIEvent { lat: number; lng: number; title: string; description: string; date: string; exact_location_name?: string; isRaw?: boolean; isMissile?: boolean; }

// --- 2. SUB-COMPONENTS (UI Only) ---
function TargetLock({ visible }: { visible: boolean }) {
  if (!visible) return null;
  return (
    <div className="fixed inset-0 pointer-events-none z-[9999] flex items-center justify-center">
      <div className="absolute w-64 h-64 border border-red-500/30 rounded-full animate-spin-slow border-dashed" />
      <div className="absolute w-48 h-48 border-2 border-red-500/60 rounded-full animate-spin-reverse border-t-transparent border-l-transparent" />
      <div className="absolute w-32 h-32 border-4 border-red-600 rounded-lg animate-ping-once opacity-50" />
      <div className="relative w-12 h-12 flex items-center justify-center"><div className="absolute w-[1px] h-full bg-red-500/80"></div><div className="absolute h-[1px] w-full bg-red-500/80"></div><div className="w-2 h-2 bg-red-600 rounded-full animate-pulse shadow-[0_0_10px_#ef4444]"></div></div>
      <div className="absolute mt-32 text-red-500 font-mono text-[10px] font-bold tracking-[0.2em] animate-pulse">TARGET LOCK ACQUIRED</div>
      <style jsx>{`.animate-spin-slow { animation: spin 4s linear infinite; } .animate-spin-reverse { animation: spin 1s linear infinite reverse; } .animate-ping-once { animation: ping 0.5s cubic-bezier(0, 0, 0.2, 1) 1; } @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function DigitalRain() {
  return (
    <div className="fixed inset-0 pointer-events-none z-[10000] opacity-20 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-500/10 to-transparent animate-pulse" />
      <div className="flex justify-around w-full h-full">
        {[...Array(15)].map((_, i) => (<div key={i} className="text-[10px] text-blue-400 font-mono writing-vertical leading-none animate-bounce" style={{ animationDuration: `${Math.random() * 2 + 1}s`, opacity: Math.random() }}>{Math.random() > 0.5 ? "10101011" : "00110100"}</div>))}
      </div>
    </div>
  );
}

function NewsTicker({ items }: { items: string[] }) {
  return (
    <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 w-[90%] md:w-[70%] lg:w-[50%] bg-black/90 backdrop-blur-xl border border-blue-500/30 rounded-full h-10 flex items-center z-[5000] overflow-hidden shadow-[0_0_30px_rgba(30,58,138,0.6)]">
      <div className="bg-blue-950/80 px-4 h-full flex items-center gap-2 text-[10px] font-bold text-blue-300 border-r border-blue-500/30 whitespace-nowrap z-10"><span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span></span> LIVE FEED</div>
      <div className="flex-1 overflow-hidden relative mask-fade-sides h-full flex items-center"><div className="flex whitespace-nowrap animate-ticker items-center">{items.map((text, i) => <span key={i} className="text-[11px] font-mono text-blue-400/80 mx-8 flex items-center tracking-wider"><span className="text-red-500 mr-2 text-[8px]">▲</span> {text}</span>)}{items.map((text, i) => <span key={`dup-${i}`} className="text-[11px] font-mono text-blue-400/80 mx-8 flex items-center tracking-wider"><span className="text-red-500 mr-2 text-[8px]">▲</span> {text}</span>)}</div></div>
      <style jsx>{`@keyframes ticker { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } } .animate-ticker { animation: ticker 60s linear infinite; } .mask-fade-sides { mask-image: linear-gradient(to right, transparent, black 20px, black 95%, transparent); }`}</style>
    </div>
  );
}

// --- 3. MAIN COMPONENT ---
export default function AIAnalystLayer() {
  const [aiEvents, setAiEvents] = useState<AIEvent[]>([]); 
  const [rawEvents, setRawEvents] = useState<AIEvent[]>([]); 
  const [missileTargets, setMissileTargets] = useState<{lat: number, lng: number}[]>([]);
  
  const [rawFeedText, setRawFeedText] = useState<string>(""); 
  const [situationReport, setSituationReport] = useState<string>(""); 
  const [loading, setLoading] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [taskedCoords, setTaskedCoords] = useState<{lat: number, lng: number} | null>(null);

  const extractRawKineticEvents = (rawFeed: string) => {
    const lines = rawFeed.split('\n');
    const newRawEvents: AIEvent[] = [];

    lines.forEach(line => {
      let cleanTitle = line.replace(/\[SRC:.*?\]/g, '').trim();
      if (!cleanTitle) return;

      let analysisText = cleanTitle.toLowerCase();
      analysisText = analysisText.replace(/u\.a\.e\.?/g, 'uae');
      analysisText = analysisText.replace(/u\.s\.?/g, 'us');
      analysisText = analysisText.replace(/['’]s/g, 's'); 
      analysisText = analysisText.replace(/washington post|new york times|wall street journal|jerusalem post|arab news|gulf news|times of israel|al jazeera|dimsum daily|times kuwait|reuters|ap news|wsj|bloomberg/gi, '');

      const isMissile = analysisText.includes('missile') || analysisText.includes('rocket') || analysisText.includes('ballistic') || analysisText.includes('drone') || analysisText.includes('uav') || analysisText.includes('air defense');

      const triggeredLocations = new Set<typeof COUNTRY_MAP[0]>();

      COUNTRY_MAP.forEach(country => {
        if (country.keywords.some(kw => analysisText.includes(kw))) {
          triggeredLocations.add(country);
        }
      });

      if (MACRO_GULF_KEYWORDS.some(kw => analysisText.includes(kw))) {
        COUNTRY_MAP.forEach(country => {
          if (GULF_COUNTRIES_TO_TRIGGER.includes(country.name)) {
            triggeredLocations.add(country);
          }
        });
      }

      triggeredLocations.forEach(country => {
        const existing = newRawEvents.find(e => e.lat === country.lat && e.lng === country.lng);
        
        if (existing) {
          if (!existing.description.includes(cleanTitle.substring(0, 20))) {
            existing.description += `\n• ${cleanTitle}`;
          }
          if (isMissile) {
            existing.isMissile = true; 
            existing.title = `MISSILE ALERT: ${country.name}`;
          }
        } else {
          newRawEvents.push({
            title: isMissile ? `MISSILE ALERT: ${country.name}` : `TACTICAL POINTER: ${country.name}`,
            description: `• ${cleanTitle}`,
            lat: country.lat,
            lng: country.lng,
            date: "LIVE DECODE",
            exact_location_name: country.name,
            isRaw: true,
            isMissile: isMissile
          });
        }
      });
    });
    return newRawEvents;
  };

  const runAnalysis = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/intel/analyze', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ context: null }) });
      if (!res.ok) throw new Error("Server Error");
      const data = await res.json();
      
      if (data.situation_report) setSituationReport(data.situation_report);

      let fetchedRawEvents: AIEvent[] = [];
      if (data.rawFeed) {
        setRawFeedText(data.rawFeed);
        fetchedRawEvents = extractRawKineticEvents(data.rawFeed);
      }
      
      setRawEvents(fetchedRawEvents);

      const targets = fetchedRawEvents
        .filter(e => e.isMissile || (e.title && e.title.toUpperCase().includes('MISSILE')))
        .map(e => ({ lat: e.lat, lng: e.lng }))
        .filter(t => typeof t.lat === 'number' && typeof t.lng === 'number' && !isNaN(t.lat) && !isNaN(t.lng));

      const uniqueSet = new Set<string>(targets.map(t => `${t.lat},${t.lng}`));
      const uniqueTargets = Array.from(uniqueSet).map((str: string) => { 
        const [lat, lng] = str.split(','); 
        return { lat: parseFloat(lat), lng: parseFloat(lng) }; 
      });

      setMissileTargets(uniqueTargets);
      
    } catch (e: any) { console.error("Analyst Failed:", e.message); } finally { setLoading(false); }
  };

  const handleEventClick = (lat?: number, lng?: number) => { 
    if (lat == null || lng == null || isNaN(lat) || isNaN(lng)) return; 
    setIsLocked(true);
    setTimeout(() => setIsLocked(false), 2000);
  };

  useEffect(() => { runAnalysis(); }, []);
  const tickerItems = useMemo(() => rawEvents.length > 0 ? rawEvents.map(e => `[${e.title?.toUpperCase()}] ${e.description.split('\n')[0].replace('• ', '')}`) : ["SATELLITE DOWNLINK ESTABLISHED..."], [rawEvents]);

  return (
    <>
      {/* 3D GLOBE RENDERER */}
      <TacticalGlobe events={rawEvents} missileTargets={missileTargets} />

      {/* UI OVERLAYS */}
      {loading && <DigitalRain />}
      <TargetLock visible={isLocked} />
      <NewsTicker items={tickerItems} />

      <div className="absolute top-24 left-6 z-[1000] w-80 flex flex-col gap-4 pointer-events-none">
        <div className="bg-black/90 backdrop-blur-md border border-white/10 p-4 rounded text-white shadow-2xl font-mono flex flex-col max-h-[500px] pointer-events-auto">
           <div className="flex justify-between items-center mb-3 flex-shrink-0">
             <h4 className="text-[10px] text-blue-400 font-bold tracking-widest italic">AI OVERWATCH // SITREP</h4>
             {loading && <div className="animate-spin h-3 w-3 border-2 border-blue-500 rounded-full border-t-transparent"></div>}
           </div>
           
           <div className="text-[9px] text-blue-100 mb-4 border border-blue-500/30 bg-blue-950/20 p-2 rounded shadow-inner flex-shrink-0">
             {situationReport ? (
               <div className="italic leading-relaxed">
                 <span className="text-blue-500 font-bold not-italic mr-1">DECODE:</span> 
                 {situationReport}
               </div>
             ) : (
               <span className="text-blue-300/40">ANALYZING OSINT GRID FOR MACRO TRENDS...</span>
             )}
           </div>

           <div className="space-y-4 overflow-y-auto custom-scrollbar pr-2 flex-grow">             
             <div>
               <h5 className="text-[9px] font-bold text-white/60 mb-2 uppercase tracking-tighter flex items-center gap-2 border-b border-white/10 pb-2">
                 <span className="w-1.5 h-1.5 bg-red-600 rounded-sm"></span> Tactical Pointers ({rawEvents.length})
               </h5>
               {rawEvents.length === 0 && <div className="text-[9px] text-gray-500 italic">Awaiting kinetic data...</div>}
               {rawEvents.map((evt, i) => (
                 <div key={`raw-${i}`} onClick={() => handleEventClick(evt.lat, evt.lng)} className={`mb-2 border-l pl-3 py-1 hover:bg-white/5 transition cursor-pointer ${evt.isMissile ? 'border-orange-500/50' : 'border-red-900'}`}>
                   <div className={`text-[10px] font-bold truncate ${evt.isMissile ? 'text-orange-400' : 'text-red-400'}`}>{evt.title}</div>
                 </div>
               ))}
             </div>
           </div>
           
           <button onClick={runAnalysis} disabled={loading} className="mt-4 flex-shrink-0 w-full bg-blue-600/10 hover:bg-blue-600/30 border border-blue-500/50 text-blue-400 text-[10px] py-2 rounded transition font-bold tracking-widest uppercase">{loading ? "INITIALIZING..." : "REFRESH INTELLIGENCE"}</button>
        </div>

        <div className="pointer-events-auto">
          <WarMonitor events={rawEvents} rawIntel={rawFeedText} />
        </div>
      </div>

      {taskedCoords && (
        <SatelliteTasker 
          lat={taskedCoords.lat} 
          lng={taskedCoords.lng} 
          onClose={() => setTaskedCoords(null)} 
        />
      )}
    </>
  );
}