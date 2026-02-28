"use client";

import { useEffect, useState, useMemo } from 'react';
import { Marker, Circle, Tooltip, useMap } from 'react-leaflet';
import L from 'leaflet';

// --- OPTIMIZED ICONS (Smaller/Lighter) ---
const siloIcon = L.divIcon({
  className: 'bg-transparent',
  html: `<div class="relative flex items-center justify-center w-4 h-4">
           <div class="w-1.5 h-1.5 bg-yellow-500 rounded-full shadow-[0_0_5px_#eab308]"></div>
           <div class="absolute w-3 h-3 border border-yellow-600/40 rounded-full opacity-70"></div>
         </div>`,
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});

interface MilitaryBase {
  id: string;
  name: string;
  lat: number;
  lng: number;
  category: string;
}

export default function TacticalLayer() {
  const [bases, setBases] = useState<MilitaryBase[]>([]);
  const [selectedBase, setSelectedBase] = useState<string | null>(null);
  const map = useMap();

  // --- 1. FILTER LOGIC ---
  // Only keep bases that match these specific military/country keywords
  const TARGET_KEYWORDS = [
    // USA
    "AFB", "Air Force Base", "Naval", "NAS ", "Fort ", "Camp ", "USMC", "USA", "United States",
    // Israel
    "Israel", "Hatzor", "Ramon", "Nevatim", "Tel Nof", "Palmachim",
    // Japan
    "Japan", "JASDF", "JMSDF", "Kadena", "Yokota", "Misawa", "Okinawa",
    // Ukraine
    "Ukraine", "Kyiv", "Odesa", "Sevastopol", "Crimea", "Donetsk",
    // Russia (Fallback if not in specific file)
    "Russia", "Russian", "Moscow"
  ];

  const fetchAndParseKML = async (url: string, category: string, useFilter = false) => {
    try {
      const res = await fetch(url);
      if (!res.ok) return [];
      
      const text = await res.text();
      const parser = new DOMParser();
      const kml = parser.parseFromString(text, "text/xml");
      const placemarks = Array.from(kml.getElementsByTagName("Placemark"));

      return placemarks.map((p, idx) => {
        const coordsRaw = p.getElementsByTagName("coordinates")[0]?.textContent;
        const name = p.getElementsByTagName("name")[0]?.textContent || "Unknown";
        
        if (!coordsRaw) return null;

        // FILTER CHECK
        if (useFilter) {
          const match = TARGET_KEYWORDS.some(k => name.toLowerCase().includes(k.toLowerCase()));
          if (!match) return null; // Skip irrelevant bases
        }

        const [lng, lat] = coordsRaw.trim().split(",").map(Number);
        
        // Sanity check coordinates
        if (isNaN(lat) || isNaN(lng)) return null;

        return {
          id: `${category}-${idx}`,
          name: name.replace(/_/g, " "), // Clean up names
          lat, 
          lng, 
          category
        };
      }).filter(Boolean) as MilitaryBase[];

    } catch (e) {
      console.error(`Error loading ${url}`, e);
      return [];
    }
  };

  useEffect(() => {
    const loadData = async () => {
      // 1. Load Specific Files (North Korea & Russia are small, so load all)
      const nk = await fetchAndParseKML('/north_korea.kml', 'DPRK', false);
      const ru = await fetchAndParseKML('/russian_bases.kml', 'RUSSIA', false);

      // 2. Load World File (FILTERED) - This reduces the lag
      const world = await fetchAndParseKML('/world_bases.kml', 'ALLIED/OTHER', true);

      // 3. Merge
      setBases([...nk, ...ru, ...world]);
    };
    
    // Debounce load slightly to let map init
    const timer = setTimeout(loadData, 500);
    return () => clearTimeout(timer);
  }, []);

  const handleSelect = (base: MilitaryBase) => {
    if (selectedBase === base.id) {
      setSelectedBase(null);
    } else {
      setSelectedBase(base.id);
      map.flyTo([base.lat, base.lng], 6, { duration: 1.5 });
    }
  };

  const activeSite = bases.find(b => b.id === selectedBase);

  // Memoize markers to prevent re-renders
  const markers = useMemo(() => (
    bases.map(base => (
      <Marker
        key={base.id}
        position={[base.lat, base.lng]}
        icon={siloIcon}
        eventHandlers={{ click: () => handleSelect(base) }}
      >
        <Tooltip direction="top" offset={[0, -5]} className="bg-black/80 border-yellow-500 text-yellow-500 font-mono text-[10px]">
          {base.name}
        </Tooltip>
      </Marker>
    ))
  ), [bases]);

  return (
    <>
      {markers}

      {activeSite && (
        <>
           {/* RINGS */}
           <Circle center={[activeSite.lat, activeSite.lng]} radius={500000}
             pathOptions={{ color: '#ef4444', weight: 1, fillOpacity: 0.1, dashArray: '4, 4' }}>
           </Circle>
           
           <Circle center={[activeSite.lat, activeSite.lng]} radius={1500000}
             pathOptions={{ color: '#f59e0b', weight: 1, fillOpacity: 0, dashArray: '8, 8' }}>
           </Circle>

           <Circle center={[activeSite.lat, activeSite.lng]} radius={5000000}
             pathOptions={{ color: '#3b82f6', weight: 1, fillOpacity: 0 }}>
           </Circle>
        </>
      )}
    </>
  );
}