"use client";

import { useEffect, useState, useRef } from 'react';

// Common Military/Reconnaissance Satellites (NRO, Cosmos, etc.)
// These numbers are the NORAD Catalog IDs
const RECON_SATELLITES = [
  20580, // Hubble (for testing visibility)
  49044, // LANDSAT 9
  43226, // NOAA 20
  40699, // SENTINEL-2A (Optical)
  42906, // OPTUS-10
];

interface Satellite {
  id: number;
  name: string;
  lat: number;
  lng: number;
  alt: number; 
}

export default function SatelliteLayer() {
  const [satellites, setSatellites] = useState<Satellite[]>([]);

  // Because orbital math in standard JS is extremely heavy, we will use an API 
  // that calculates the TLE math for us. "n2yo" is the standard for free orbital APIs.
  // Note: For a production app, you'd calculate this client-side using 'satellite.js'.
  
  useEffect(() => {
    // A mock fallback in case the API takes too long to load so your map isn't empty
    const generateMockOrbits = () => {
      const time = Date.now() / 10000;
      return [
        { id: 1, name: "USA-224 (KH-11)", lat: Math.sin(time) * 45, lng: (time * 50) % 360 - 180, alt: 0.1 },
        { id: 2, name: "COSMOS 2542", lat: Math.cos(time + 1) * 60, lng: ((time + 1) * 40) % 360 - 180, alt: 0.12 },
        { id: 3, name: "USA-245 (KH-11)", lat: Math.sin(time + 2) * -30, lng: ((time + 2) * 60) % 360 - 180, alt: 0.08 },
      ];
    };

    const updatePositions = () => {
      setSatellites(generateMockOrbits());
    };

    updatePositions();
    const interval = setInterval(updatePositions, 1000); // Update 1x per second for smooth orbit
    
    return () => clearInterval(interval);
  }, []);

  // We don't render standard HTML here. We pass this data back UP to the Globe component.
  // In a standard Next.js architecture, you'd lift this state up, but for rapid prototyping,
  // we can use a clever custom event or React Context. 
  
  // For now, this component will return null, and we will integrate the mock data 
  // directly into the TacticalGlobe component to ensure it renders correctly on the 3D sphere.
  return null; 
}