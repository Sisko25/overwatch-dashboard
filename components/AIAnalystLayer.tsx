"use client";

import { useState, useEffect } from 'react';
import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';

// 🔴 Red Icon for Current Events
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

// 🟣 Purple Icon for Future Predictions
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

interface AIEvent {
  lat: number;
  lng: number;
  title: string;
  description: string;
  date?: string;
}

interface AIPrediction {
  lat: number;
  lng: number;
  location: string;
  prediction: string;
  probability: string;
}

export default function AIAnalystLayer() {
  const [events, setEvents] = useState<AIEvent[]>([]);
  const [predictions, setPredictions] = useState<AIPrediction[]>([]);
  const [loading, setLoading] = useState(false);

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

    } catch (e) {
      console.error("Analyst Failed");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runAnalysis();
  }, []);

  return (
    <>
      {/* 🔴 1. Current Events (Red Markers) */}
      {events.map((evt, idx) => (
        <Marker key={`evt-${idx}`} position={[evt.lat, evt.lng]} icon={redIcon}>
          <Popup>
            <div className="p-2 min-w-[200px]">
              <div className="flex items-center gap-2 mb-2">
                <span className="animate-pulse w-2 h-2 bg-red-600 rounded-full"></span>
                <strong className="text-red-700 font-mono text-xs uppercase">CONFIRMED KINETIC</strong>
              </div>
              <h3 className="font-bold text-black text-sm">{evt.title}</h3>
              <p className="text-gray-800 text-xs mt-1 leading-snug">{evt.description}</p>
              <div className="mt-2 text-[10px] text-gray-500 font-mono">{evt.date}</div>
            </div>
          </Popup>
        </Marker>
      ))}

      {/* 🟣 2. Future Predictions (Purple Markers) */}
      {predictions.map((pred, idx) => (
        <Marker key={`pred-${idx}`} position={[pred.lat, pred.lng]} icon={purpleIcon}>
          <Popup>
            <div className="p-2 min-w-[220px]">
              <div className="flex items-center gap-2 mb-2">
                <span className="animate-bounce w-2 h-2 bg-purple-600 rounded-full"></span>
                <strong className="text-purple-700 font-mono text-xs uppercase">STRATEGIC FORECAST</strong>
              </div>
              <h3 className="font-bold text-black text-sm">{pred.location}</h3>
              <div className="mt-2 p-2 bg-purple-50 rounded border-l-2 border-purple-500">
                <p className="text-purple-900 text-xs italic font-semibold leading-relaxed">
                  "{pred.prediction}"
                </p>
              </div>
              <div className="mt-2 flex justify-between items-center">
                <span className="text-[10px] font-mono text-gray-500">PROBABILITY:</span>
                <span className="text-[10px] font-bold text-purple-700 bg-purple-100 px-2 py-0.5 rounded-full">{pred.probability}</span>
              </div>
            </div>
          </Popup>
        </Marker>
      ))}

      {/* 3. Floating Panel */}
      <div className="absolute top-24 left-6 z-[1000] bg-black/90 backdrop-blur-md border border-gray-800 p-4 rounded text-white w-72 shadow-2xl">
        <div className="flex justify-between items-center mb-3">
          <h4 className="text-xs font-mono text-blue-400 font-bold tracking-widest">SAF Deep Dive</h4>
          {loading && <div className="animate-spin h-3 w-3 border-2 border-blue-500 rounded-full border-t-transparent"></div>}
        </div>
        
        {/* Scrollable Feed */}
        <div className="space-y-3 max-h-64 overflow-y-auto custom-scrollbar pr-2">
          
          {/* Section: Live Events */}
          <div>
            <h5 className="text-[10px] font-bold text-gray-500 mb-2 uppercase">Current Kinetic ({events.length})</h5>
            {events.map((evt, i) => (
              <div key={i} className="mb-2 border-l-2 border-red-500 pl-3 py-1 cursor-pointer hover:bg-white/5 transition">
                <div className="text-[10px] text-red-400 font-mono">{evt.title}</div>
                <div className="text-[9px] text-gray-400 truncate">{evt.description}</div>
              </div>
            ))}
          </div>

          {/* Section: Predictions */}
          <div>
             <h5 className="text-[10px] font-bold text-purple-400 mb-2 uppercase border-t border-gray-800 pt-2">Forecasts ({predictions.length})</h5>
             {predictions.map((pred, i) => (
              <div key={i} className="mb-2 border-l-2 border-purple-500 pl-3 py-1 cursor-pointer hover:bg-white/5 transition">
                <div className="flex justify-between">
                  <span className="text-[10px] text-purple-300 font-bold">{pred.location}</span>
                  <span className="text-[8px] bg-purple-900/50 px-1 rounded text-purple-200">{pred.probability}</span>
                </div>
                <div className="text-[9px] text-gray-400 leading-tight mt-1 line-clamp-2">{pred.prediction}</div>
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