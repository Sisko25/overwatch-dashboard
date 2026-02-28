"use client";

import { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Marker, Popup, useMap, useMapEvent } from 'react-leaflet';
import L from 'leaflet';
import WarMonitor from './WarMonitor'; 
import SatelliteTasker from './SatelliteTasker';

// --- 1. DIRECT COUNTRY & BASE MAPPER ---
// No regex, just straightforward arrays of keywords.
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
  { name: "YEMEN", lat: 15.3694, lng: 44.1910, keywords: ["yemen", "sanaa", "houthi", "hodeidah"] },
  { name: "SYRIA", lat: 33.5138, lng: 36.2765, keywords: ["syria", "damascus", "hmeimim", "aleppo"] },
  { name: "IRAQ", lat: 33.3152, lng: 44.3661, keywords: ["iraq", "baghdad", "al asad", "erbil", "jurf"] },
  { name: "PAKISTAN", lat: 33.6844, lng: 73.0479, keywords: ["pakistan", "islamabad", "khyber", "balochistan"] },
  { name: "AFGHANISTAN", lat: 34.5553, lng: 69.2075, keywords: ["afghanistan", "kabul"] },
  { name: "JORDAN", lat: 31.9454, lng: 35.9284, keywords: ["jordan", "amman"] },
  { name: "USA", lat: 38.9072, lng: -77.0369, keywords: ["usa", "united states", "washington"] } // Stripped from headlines if it's "Washington Post"
];

// If the headline mentions the entire region, light up all allied bases
const MACRO_GULF_KEYWORDS = ["gulf", "us bases", "u.s. bases", "arab states", "middle east"];
const GULF_COUNTRIES_TO_TRIGGER = ["BAHRAIN", "QATAR", "UAE", "KUWAIT", "SAUDI ARABIA"];

// --- 2. ICONS ---
const redIcon = L.divIcon({ className: 'bg-transparent', html: `<div class="relative flex items-center justify-center w-6 h-6"><div class="absolute w-full h-full bg-red-500 rounded-full animate-ping opacity-75"></div><div class="relative w-3 h-3 bg-red-600 rounded-full border border-white shadow-lg"></div></div>`, iconSize: [24, 24], iconAnchor: [12, 12] });
const orangeIcon = L.divIcon({ className: 'bg-transparent', html: `<div class="relative flex items-center justify-center w-6 h-6"><div class="absolute w-full h-full bg-orange-500 rounded-full animate-ping opacity-75"></div><div class="relative w-3 h-3 bg-orange-600 rounded-full border border-white shadow-[0_0_10px_#f97316]"></div></div>`, iconSize: [24, 24], iconAnchor: [12, 12] });
const redArrowIcon = L.divIcon({ 
  className: 'bg-transparent', 
  html: `<div class="relative flex flex-col items-center justify-center w-8 h-12 -mt-6"><div class="animate-bounce flex flex-col items-center"><div class="w-4 h-6 bg-red-600 border border-red-900 shadow-[0_0_10px_#ef4444]" style="clip-path: polygon(50% 100%, 0 0, 100% 0);"></div><div class="w-1.5 h-1.5 bg-white rounded-full mt-1 shadow-[0_0_5px_#fff]"></div></div></div>`, 
  iconSize: [32, 48], 
  iconAnchor: [16, 48] 
});

interface AIEvent { lat: number; lng: number; title: string; description: string; date: string; exact_location_name?: string; isRaw?: boolean; isMissile?: boolean; }

// --- 3. SUB-COMPONENTS ---
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

function GlobalMissileRain({ targets }: { targets: { lat: number, lng: number }[] }) {
  const map = useMap();
  const [progress, setProgress] = useState(0);
  const [, setTick] = useState(0); 

  useMapEvent('move', () => setTick(t => t + 1));

  useEffect(() => {
    const interval = setInterval(() => {
      let start = Date.now();
      const animate = () => {
        const p = Math.min((Date.now() - start) / 1500, 1);
        setProgress(p);
        if (p < 1) requestAnimationFrame(animate);
        else setTimeout(() => setProgress(0), 1000); 
      };
      requestAnimationFrame(animate);
    }, 5000); 
    
    return () => clearInterval(interval);
  }, []);

  const safeTargets = targets.filter(t => typeof t.lat === 'number' && typeof t.lng === 'number' && !isNaN(t.lat) && !isNaN(t.lng));
  if (progress === 0 || safeTargets.length === 0) return null;

  return createPortal(
    <div className="fixed inset-0 pointer-events-none z-[9999]" style={{ width: '100vw', height: '100vh' }}>
      <svg width="100%" height="100%">
        {safeTargets.map((t, i) => {
          const end = map.latLngToContainerPoint([t.lat, t.lng]);
          const offset = i % 2 === 0 ? 200 : -200;
          const startX = end.x + offset; 
          const startY = end.y - 600; 
          
          const currentX = startX + (end.x - startX) * progress;
          const currentY = startY + (end.y - startY) * progress;

          return (
            <g key={`missile-${i}`}>
              {progress < 1 ? (
                <>
                  <line x1={startX} y1={startY} x2={currentX} y2={currentY} stroke="url(#missileGradient)" strokeWidth="4" strokeLinecap="round" />
                  <circle cx={currentX} cy={currentY} r="5" fill="#ffffff" stroke="#f97316" strokeWidth="2" className="animate-pulse" />
                </>
              ) : (
                <g transform={`translate(${end.x},${end.y})`}>
                  <circle r="40" fill="rgba(239, 68, 68, 0.4)" className="animate-ping" />
                  <circle r="15" fill="#dc2626" />
                  <circle r="6" fill="#fb923c" />
                </g>
              )}
            </g>
          );
        })}
        <defs>
          <linearGradient id="missileGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="transparent" />
            <stop offset="100%" stopColor="#f97316" />
          </linearGradient>
        </defs>
      </svg>
    </div>,
    document.body
  );
}

// --- MAIN COMPONENT ---
export default function AIAnalystLayer() {
  const map = useMap(); 
  
  const [aiEvents, setAiEvents] = useState<AIEvent[]>([]); 
  const [rawEvents, setRawEvents] = useState<AIEvent[]>([]); 
  const [missileTargets, setMissileTargets] = useState<{lat: number, lng: number}[]>([]);
  
  const [rawFeedText, setRawFeedText] = useState<string>(""); 
  const [situationReport, setSituationReport] = useState<string>(""); 
  const [loading, setLoading] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [taskedCoords, setTaskedCoords] = useState<{lat: number, lng: number} | null>(null);

  // BRUTE FORCE EXTRACTION: Read Headline -> Find Country -> Add Marker
  const extractRawKineticEvents = (rawFeed: string) => {
    const lines = rawFeed.split('\n');
    const newRawEvents: AIEvent[] = [];

    lines.forEach(line => {
      let cleanTitle = line.replace(/\[SRC:.*?\]/g, '').trim();
      if (!cleanTitle) return;

      // Force lowercase
      let analysisText = cleanTitle.toLowerCase();
      
      // Fix specific punctuation issues immediately (u.a.e -> uae)
      analysisText = analysisText.replace(/u\.a\.e\.?/g, 'uae');
      analysisText = analysisText.replace(/u\.s\.?/g, 'us');
      analysisText = analysisText.replace(/['’]s/g, 's'); // "uae's" -> "uaes"

      // Completely remove news sources so "Washington Post" doesn't trigger "USA"
      analysisText = analysisText.replace(/washington post|new york times|wall street journal|jerusalem post|arab news|gulf news|times of israel|al jazeera|dimsum daily|times kuwait|reuters|ap news|wsj|bloomberg|dw\.com/gi, '');

      // Identify if it's a missile attack based on raw string check
      const isMissile = analysisText.includes('missile') || analysisText.includes('rocket') || analysisText.includes('ballistic') || analysisText.includes('drone') || analysisText.includes('uav') || analysisText.includes('air defense');

      const triggeredLocations = new Set<typeof COUNTRY_MAP[0]>();

      // 1. EXACT COUNTRY MATCHING
      COUNTRY_MAP.forEach(country => {
        // If ANY of the country's keywords are in the headline, add it to the trigger list
        if (country.keywords.some(kw => analysisText.includes(kw))) {
          triggeredLocations.add(country);
        }
      });

      // 2. MACRO-REGION MULTIPLIER (e.g., if it says "Gulf", light up all Gulf states)
      if (MACRO_GULF_KEYWORDS.some(kw => analysisText.includes(kw))) {
        COUNTRY_MAP.forEach(country => {
          if (GULF_COUNTRIES_TO_TRIGGER.includes(country.name)) {
            triggeredLocations.add(country);
          }
        });
      }

      // Create the markers for every country triggered
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
        // Uses the new Brute Force Headline Reader
        fetchedRawEvents = extractRawKineticEvents(data.rawFeed);
      }
      
      setRawEvents(fetchedRawEvents);

      // Create missiles array for the animation overlay
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
    map.flyTo([lat, lng], 11, { animate: true, duration: 1.5 }); 
    setIsLocked(true);
    setTimeout(() => setIsLocked(false), 2000);
  };

  useEffect(() => { runAnalysis(); }, []);
  const tickerItems = useMemo(() => rawEvents.length > 0 ? rawEvents.map(e => `[${e.title?.toUpperCase()}] ${e.description.split('\n')[0].replace('• ', '')}`) : ["SATELLITE DOWNLINK ESTABLISHED..."], [rawEvents]);

  return (
    <>
      {loading && <DigitalRain />}
      <TargetLock visible={isLocked} />
      <NewsTicker items={tickerItems} />
      
      <GlobalMissileRain targets={missileTargets} />

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

      {/* RENDER RAW FEED (Red Arrows & Orange Missiles) */}
      {rawEvents.map((evt, idx) => (
        evt.lat != null && evt.lng != null && !isNaN(evt.lat) && !isNaN(evt.lng) && (
          <Marker key={`rawevt-${idx}`} position={[evt.lat, evt.lng]} icon={evt.isMissile ? orangeIcon : redArrowIcon} zIndexOffset={1000} eventHandlers={{ click: () => handleEventClick(evt.lat, evt.lng) }}>
            <Popup>
              <div className={`bg-black text-white p-2 text-xs min-w-[250px] border ${evt.isMissile ? 'border-orange-500/50' : 'border-red-900'}`}>
                <div className={`flex items-center gap-2 mb-2 border-b pb-1 ${evt.isMissile ? 'border-orange-500/50' : 'border-red-900'}`}>
                  <span className={`w-1.5 h-1.5 ${evt.isMissile ? 'bg-orange-500 rounded-full animate-pulse' : 'bg-red-600'}`}></span>
                  <strong className={`text-[10px] tracking-widest ${evt.isMissile ? 'text-orange-400' : 'text-red-500'}`}>
                    {evt.isMissile ? "MISSILE INTERCEPT" : "RAW KINETIC POINTER"}
                  </strong>
                </div>
                <h3 className="font-bold text-xs text-white">{evt.title}</h3>
                <div className="text-gray-400 text-[10px] mt-2 leading-relaxed whitespace-pre-wrap font-mono">{evt.description}</div>
                <button onClick={() => setTaskedCoords({ lat: evt.lat, lng: evt.lng })} className="mt-3 w-full border border-cyan-500 text-cyan-400 hover:bg-cyan-900/50 py-1 font-mono text-[9px] tracking-widest transition">[ 🛰️ TASK SATELLITE ]</button>
              </div>
            </Popup>
          </Marker>
        )
      ))}

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