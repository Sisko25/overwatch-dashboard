"use client";

import React from 'react';

export interface ThreatAssessment {
  id: string;
  origin: string;
  target: string;
  alert_level: 'ELEVATED' | 'HIGH' | 'CRITICAL';
  threat_type: string;
  probability_score: number;
  reasoning: string;
}

export default function DetectionPanel({ threats }: { threats: ThreatAssessment[] }) {
  if (!threats || threats.length === 0) return null;

  return (
    <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-[800px] bg-black/90 border border-red-900/50 p-4 font-mono z-[1000] shadow-[0_0_20px_rgba(239,68,68,0.2)]">
      <div className="flex justify-between items-center mb-3 border-b border-red-900/50 pb-2">
        <span className="text-red-500 animate-pulse font-bold tracking-widest">● EARLY WARNING</span>
        <span className="text-[10px] text-slate-500 tracking-widest">DATALINK: ADSB-X // DIS intel</span>
      </div>
      
      <div className="space-y-3">
        {threats.map((t, i) => (
          <div key={i} className="flex flex-col border-l-2 border-red-600 pl-3">
            <div className="flex justify-between items-start">
              <span className="text-white font-bold text-sm uppercase">{t.threat_type}</span>
              <span className={`text-xs font-bold px-2 py-0.5 ${t.alert_level === 'CRITICAL' ? 'bg-red-600 text-white animate-pulse' : 'bg-orange-600 text-white'}`}>
                {t.alert_level}
              </span>
            </div>
            <div className="text-xs text-cyan-400 mt-1">
              PROBABILITY: {t.probability_score}% | TRAJECTORY: {t.origin} {'->'} {t.target}
            </div>
            <div className="text-[10px] text-slate-400 mt-1 leading-relaxed">
              <span className="text-slate-500">CORRELATION:</span> {t.reasoning}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}