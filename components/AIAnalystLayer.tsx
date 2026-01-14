"use client";

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Marker, Popup, useMap, useMapEvent } from 'react-leaflet';
import L from 'leaflet';

// --- 1. CUSTOM ICONS ---
const redIcon = L.divIcon({
  className: 'bg-transparent',
  html: `
    <div class="relative flex items-center justify-center w-6 h-6">
      <div class="absolute w-full h-full bg-red-500 rounded-full animate-ping opacity-75"></div>
      <div class="relative w-3 h-3 bg-red-600 rounded-full border border-white shadow-lg"></div>
    </div>
  `,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

const purpleIcon = L.divIcon({
  className: 'bg-transparent',
  html: `
    <div class="relative flex items-center justify-center w-6 h-6">
      <div class="absolute w-full h-full bg-purple-500 rounded-full animate-pulse opacity-75"></div>
      <div class="relative w-3 h-3 bg-purple-600 rounded-full border border-white shadow-[0_0_10px_#a855f7]"></div>
    </div>
  `,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

// --- 2. TYPES ---
interface AIEvent {
  lat: number;
  lng: number;
  title: string;
  description: string;
  date: string;
}

interface AIPrediction {
  id: string;
  type: 'MISSILE' | 'GROUND' | 'NAVAL';
  origin_lat: number;
  origin_lng: number;
  target_lat: number;
  target_lng: number;
  location: string;
  prediction: string;
  probability: string;
}

// --- 3. SIMULATION COMPONENT (Fixed Hook Order) ---
function SimulationOverlay({ sim }: { sim: AIPrediction }) {
  const map = useMap();
  
  // HOOK 1: State
  const [progress, setProgress] = useState(0);
  // HOOK 2: State
  const [showExplosion, setShowExplosion] = useState(false);
  // HOOK 3: State
  const [mapMove, setMapMove] = useState(0);
  
  // HOOK 4: Map Event
  useMapEvent('move', () => setMapMove(n => n + 1));
  // HOOK 5: Map Event
  useMapEvent('zoom', () => setMapMove(n => n + 1));

  // HOOK 6: Effect
  useEffect(() => {
    // Safety Check inside the effect, not before it
    if (!sim.origin_lat || !sim.origin_lng || !sim.target_lat || !sim.target_lng) return;

    let startTimestamp: number;
    const duration = 15000; // 15 Seconds travel time

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const p = Math.min((timestamp - startTimestamp) / duration, 1);
      setProgress(p);

      if (p < 1) {
        requestAnimationFrame(step);
      } else {
        setShowExplosion(true);
        setTimeout(() => setShowExplosion(false), 2000);
      }
    };
    
    // Reset states on new simulation
    setProgress(0);
    setShowExplosion(false);
    requestAnimationFrame(step);
  }, [sim]); // Ensure this runs when 'sim' changes

  // 🔴 FIXED: Safety Check is now AFTER all hooks are declared.
  // This prevents "Rendered fewer hooks than expected" error.
  if (!sim.origin_lat || !sim.origin_lng || !sim.target_lat || !sim.target_lng) return null;

  // Calculate Screen Coordinates (Only runs if check passed)
  const start = map.latLngToContainerPoint([sim.origin_lat, sim.origin_lng]);
  const end = map.latLngToContainerPoint([sim.target_lat, sim.target_lng]);

  const currentX = start.x + (end.x - start.x) * progress;
  const currentY = start.y + (end.y - start.y) * progress;
  const angle = Math.atan2(end.y - start.y, end.x - start.x) * 180 / Math.PI;

  return createPortal(
    <div 
      className="fixed inset-0 pointer-events-none z-[9999]" 
      style={{ width: '100vw', height: '100vh' }}
    >
      <svg width="100%" height="100%">
        {/* Trajectory Arc */}
        <line 
          x1={start.x} y1={start.y} 
          x2={end.x} y2={end.y} 
          stroke="rgba(168, 85, 247, 0.3)" 
          strokeWidth="2" 
          strokeDasharray="8,4" 
        />

        {/* Moving Unit */}
        {sim.type === 'MISSILE' ? (
          <>
            <line 
              x1={start.x} y1={start.y} 
              x2={currentX} y2={currentY} 
              stroke="url(#missileGradient)" 
              strokeWidth="4" 
              strokeLinecap="round" 
            />
            <g transform={`translate(${currentX},${currentY})`}>
              <circle r="12" fill="rgba(217, 70, 239, 0.3)" className="animate-ping" />
              <circle r="6" fill="rgba(255, 255, 255, 0.6)" />
              <circle r="3" fill="#ffffff" stroke="#d946ef" strokeWidth="1" />
            </g>
            <defs>
              <linearGradient id="missileGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="transparent" />
                <stop offset="50%" stopColor="rgba(217, 70, 239, 0.5)" />
                <stop offset="100%" stopColor="#d946ef" />
              </linearGradient>
              <radialGradient id="explosionGradient" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
                  <stop offset="0%" stopColor="#fffbeb" />
                  <stop offset="40%" stopColor="#f59e0b" />
                  <stop offset="100%" stopColor="#dc2626" />
              </radialGradient>
            </defs>
          </>
        ) : (
          <g transform={`translate(${currentX},${currentY}) rotate(${angle})`}>
             <circle r="8" fill="rgba(217, 70, 239, 0.3)" className="animate-pulse" />
             <path d="M-12,-6 L0,0 L-12,6 L-8,0 Z" fill="#d946ef" stroke="white" strokeWidth="2" />
          </g>
        )}

        {/* EXPLOSION EFFECT AT TARGET */}
        {showExplosion && (
          <g transform={`translate(${end.x},${end.y})`}>
            <circle r="50" fill="rgba(239, 68, 68, 0.4)" className="animate-ping" style={{ animationDuration: '0.6s' }} />
            <circle r="25" fill="url(#explosionGradient)" className="animate-pulse" style={{ animationDuration: '0.3s' }} />
            <circle r="10" fill="#ffffff" className="animate-ping" style={{ animationDuration: '0.2s' }} />
          </g>
        )}
      </svg>
    </div>,
    document.body
  );
}

// --- 4. MAIN COMPONENT ---
export default function AIAnalystLayer() {
  const [events, setEvents] = useState<AIEvent[]>([]);
  const [predictions, setPredictions] = useState<AIPrediction[]>([]);
  const [activeSim, setActiveSim] = useState<AIPrediction | null>(null);
  const [loading, setLoading] = useState(false);

  const playSimulation = (pred: AIPrediction) => {
    setActiveSim(pred);
    setTimeout(() => setActiveSim(null), 18000);
  };

  const runAnalysis = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/intel/analyze', { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ context: null }) 
      });

      if (!res.ok) throw new Error("Server Error");
      const data = await res.json();
      if (data.events) setEvents(data.events);
      if (data.predictions) setPredictions(data.predictions);

    } catch (e: any) {
      console.error("Analyst Failed:", e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runAnalysis();
  }, []);

  return (
    <>
      {activeSim && <SimulationOverlay sim={activeSim} />}

      {events.map((evt, idx) => {
        if (!evt.lat || !evt.lng) return null;
        return (
          <Marker key={`evt-${idx}`} position={[evt.lat, evt.lng]} icon={redIcon}>
            <Popup>
              <div className="p-2 min-w-[200px]">
                <div className="flex items-center gap-2 mb-2">
                  <span className="animate-pulse w-2 h-2 bg-red-600 rounded-full"></span>
                  <strong className="text-red-700 font-mono text-xs uppercase">CONFIRMED KINETIC</strong>
                </div>
                <h3 className="font-bold text-black text-sm">{evt.title}</h3>
                <p className="text-gray-800 text-xs mt-1 leading-snug">{evt.description}</p>
                <div className="mt-2 text-[10px] text-gray-500 font-mono border-t border-gray-200 pt-1">
                  📅 {evt.date}
                </div>
              </div>
            </Popup>
          </Marker>
        );
      })}

      {predictions.map((pred, idx) => {
        if (!pred.target_lat || !pred.target_lng) return null;
        return (
          <Marker key={`pred-${idx}`} position={[pred.target_lat, pred.target_lng]} icon={purpleIcon}>
            <Popup>
              <div className="p-2 min-w-[220px]">
                <div className="flex items-center gap-2 mb-2">
                  <span className="animate-bounce w-2 h-2 bg-purple-600 rounded-full"></span>
                  <strong className="text-purple-700 font-mono text-xs uppercase">STRATEGIC FORECAST</strong>
                </div>
                <h3 className="font-bold text-black text-sm">{pred.location}</h3>
                <div className="mt-2 p-2 bg-purple-50 rounded border-l-2 border-purple-500">
                  <p className="text-purple-900 text-xs italic font-semibold leading-relaxed">"{pred.prediction}"</p>
                </div>
                <button 
                  onClick={() => playSimulation(pred)}
                  className="mt-3 w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-[10px] font-bold py-1.5 rounded shadow-md transition flex items-center justify-center gap-2"
                >
                  <span>▶</span> SIMULATE SCENARIO
                </button>
                <div className="mt-2 flex justify-between items-center">
                  <span className="text-[10px] font-mono text-gray-500">PROBABILITY:</span>
                  <span className="text-[10px] font-bold text-purple-700 bg-purple-100 px-2 py-0.5 rounded-full">{pred.probability}</span>
                </div>
              </div>
            </Popup>
          </Marker>
        );
      })}

      <div className="absolute top-24 left-6 z-[1000] bg-black/90 backdrop-blur-md border border-gray-800 p-4 rounded text-white w-72 shadow-2xl">
        <div className="flex justify-between items-center mb-3">
          <h4 className="text-xs font-mono text-blue-400 font-bold tracking-widest">MINDEF ANALYSIS</h4>
          {loading && <div className="animate-spin h-3 w-3 border-2 border-blue-500 rounded-full border-t-transparent"></div>}
        </div>
        <div className="space-y-3 max-h-64 overflow-y-auto custom-scrollbar pr-2">
          <div>
            <h5 className="text-[10px] font-bold text-gray-500 mb-2 uppercase">Current Kinetic ({events.length})</h5>
            {events.map((evt, i) => (
              <div key={i} className="mb-2 border-l-2 border-red-500 pl-3 py-1 cursor-pointer hover:bg-white/5 transition">
                <div className="flex justify-between">
                  <span className="text-[10px] text-red-400 font-bold">{evt.title}</span>
                  <span className="text-[8px] text-gray-500">{evt.date}</span>
                </div>
                <div className="text-[9px] text-gray-400 truncate mt-0.5">{evt.description}</div>
              </div>
            ))}
          </div>
          <div>
             <h5 className="text-[10px] font-bold text-purple-400 mb-2 uppercase border-t border-gray-800 pt-2">Forecasts ({predictions.length})</h5>
             {predictions.map((pred, i) => (
              <div 
                key={i} 
                onClick={() => playSimulation(pred)}
                className="mb-2 border-l-2 border-purple-500 pl-3 py-1 cursor-pointer hover:bg-white/10 transition group"
              >
                <div className="flex justify-between">
                  <span className="text-[10px] text-purple-300 font-bold group-hover:text-purple-200">{pred.location}</span>
                  <span className="text-[8px] bg-purple-900/50 px-1 rounded text-purple-200">{pred.probability}</span>
                </div>
                <div className="text-[9px] text-gray-400 leading-tight mt-1 line-clamp-2">{pred.prediction}</div>
                <div className="text-[8px] text-purple-500/50 mt-1 font-mono group-hover:text-purple-400">▶ Click to Simulate</div>
              </div>
            ))}
          </div>
        </div>
        <button 
          onClick={runAnalysis}
          disabled={loading}
          className="mt-4 w-full bg-blue-600/20 hover:bg-blue-600/40 border border-blue-500/50 text-blue-200 text-xs py-2 rounded transition font-mono tracking-wider"
        >
          {loading ? "INITIALIZING..." : "REFRESH INTELLIGENCE"}
        </button>
      </div>
    </>
  );
}