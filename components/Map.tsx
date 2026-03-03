"use client";

import AIAnalystLayer from './AIAnalystLayer';

export default function Map() {
  return (
    <div className="w-full h-full bg-black relative overflow-hidden cursor-crosshair">
      <AIAnalystLayer />
    </div>
  );
}