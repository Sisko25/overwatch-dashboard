"use client";

import { useMemo, useState } from 'react';

// CONFIG: Expanded keywords to catch more variations of the conflict
const CONFLICT_PAIRS = [
  { id: 'usa_irn', name: 'USA / IRAN', keywords: ['usa', 'iran', 'nuclear', 'proxy', 'carrier', 'strike'] },
  { id: 'isr_irn', name: 'ISRAEL / IRAN', keywords: ['israel', 'iran', 'hezbollah', 'tel aviv', 'tehran', 'khamenei', 'pre-emptive', 'strike', 'missile'] },
  { id: 'chn_usa', name: 'CHINA / USA', keywords: ['china', 'usa', 'taiwan', 'trade'] },
  { id: 'rus_usa', name: 'RUSSIA / USA', keywords: ['russia', 'usa', 'nato', 'ukraine'] },
  { id: 'rus_ukr', name: 'RUSSIA / UKRAINE', keywords: ['russia', 'ukraine', 'donbas', 'kyiv', 'lviv'] },
  { id: 'chn_twn', name: 'CHINA / TAIWAN', keywords: ['china', 'taiwan', 'strait', 'invasion'] },
];

// FIX: We now accept 'rawIntel' (a giant string of all headlines) 
// alongside the AI 'events' (used just for the popup details).
export default function WarMonitor({ events = [], rawIntel = "" }: { events?: any[], rawIntel?: string }) {
  const [selectedPair, setSelectedPair] = useState<string | null>(null);

  const pairData = useMemo(() => {
    const safeEvents = Array.isArray(events) ? events : [];
    
    // Lowercase the entire raw feed once for performance
    const feedText = rawIntel.toLowerCase();

    return CONFLICT_PAIRS.map(pair => {
      // 1. Calculate Score based on RAW VOLUME (Bypassing AI bottleneck)
      // Count how many times the keywords appear in the raw feed.
      let matchCount = 0;
      pair.keywords.forEach(keyword => {
          // Simple string matching to count occurrences
          const regex = new RegExp(keyword, 'g');
          const matches = feedText.match(regex);
          if (matches) matchCount += matches.length;
      });

      // Calculate Index (0.0 to 5.0)
      // Base is 1.0. Every ~3 keyword mentions bumps the score by 1.0
      let score = 1.0 + (matchCount / 3); 
      if (score > 5.0) score = 5.0;

      // 2. Find matching AI events (for the Drill-Down Modal only)
      const relevantEvents = safeEvents.filter(e => {
        const text = (e.title + e.description + (e.location || "")).toLowerCase();
        return pair.keywords.some(k => text.includes(k));
      });

      return { ...pair, score: score.toFixed(2), events: relevantEvents };
    });
  }, [events, rawIntel]);

  const getGraphPath = (score: string) => {
    const val = parseFloat(score);
    const volatility = val * 8; 
    let d = "M 0 25";
    for (let i = 10; i <= 100; i += 10) {
      const y = 25 - (Math.random() * volatility) + (volatility / 2);
      d += ` L ${i} ${Math.max(2, Math.min(48, y))}`;
    }
    return d;
  };

  const getColor = (score: string) => {
    const s = parseFloat(score);
    if (s >= 4.0) return "text-red-500 border-red-500/50 shadow-[0_0_10px_#ef4444]";
    if (s >= 2.5) return "text-orange-500 border-orange-500/50";
    return "text-green-500 border-green-500/50";
  };

  return (
    <>
      <div className="w-full bg-black/90 backdrop-blur-md border border-white/10 p-4 rounded text-white shadow-2xl font-mono pointer-events-auto">
        <div className="flex justify-between items-center mb-3 border-b border-white/10 pb-2">
          <h4 className="text-[10px] font-bold tracking-widest text-blue-400 italic">WAR MONITOR // INDEX</h4>
          <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></div>
        </div>

        <div className="space-y-2">
          {pairData.map((pair) => (
            <div 
              key={pair.id}
              onClick={() => setSelectedPair(pair.id)}
              className={`group relative p-2 border-l-2 bg-white/5 hover:bg-white/10 transition-all cursor-pointer ${getColor(pair.score)} border-current`}
            >
              <div className="flex justify-between items-end mb-1">
                <span className="text-[9px] font-bold text-gray-300 group-hover:text-white">{pair.name}</span>
                <span className="text-[10px] font-black">{pair.score}</span>
              </div>
              <div className="h-5 w-full border-b border-white/5 opacity-50 relative overflow-hidden">
                 <svg width="100%" height="100%" preserveAspectRatio="none">
                   <path d={getGraphPath(pair.score)} fill="none" stroke="currentColor" strokeWidth="1.5" />
                 </svg>
              </div>
            </div>
          ))}
        </div>
      </div>

      {selectedPair && (
        <div className="fixed inset-0 z-[5000] flex items-center justify-center bg-black/60 backdrop-blur-sm pointer-events-auto" onClick={() => setSelectedPair(null)}>
          <div className="bg-black border border-white/20 w-[500px] p-6 shadow-2xl relative" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setSelectedPair(null)} className="absolute top-3 right-3 text-gray-500 hover:text-white">✕</button>
            <h2 className="text-xl font-black text-white tracking-widest mb-1">{pairData.find(p => p.id === selectedPair)?.name}</h2>
            <div className={`text-xs font-bold mb-4 ${getColor(pairData.find(p => p.id === selectedPair)?.score || "0")}`}>
              THREAT INDEX: {pairData.find(p => p.id === selectedPair)?.score}
            </div>
            <div className="space-y-3 max-h-[300px] overflow-y-auto custom-scrollbar border-t border-white/10 pt-3">
               {pairData.find(p => p.id === selectedPair)?.events.length === 0 ? (
                 <div className="text-gray-500 text-xs italic">AWAITING AI SUMMARY OF RAW DATA...</div>
               ) : (
                 pairData.find(p => p.id === selectedPair)?.events.map((evt, idx) => (
                   <div key={idx} className="bg-white/5 p-2 border-l border-blue-500">
                     <div className="text-[11px] font-bold text-gray-200">{evt.title}</div>
                     <div className="text-[9px] text-gray-500 mt-1">{evt.description}</div>
                   </div>
                 ))
               )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}