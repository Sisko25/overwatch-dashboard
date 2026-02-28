import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const TACTICAL_CALLSIGNS = [
  "IAF", "AIA", "ISRAEL", "GLF", "IRIAF", "EP-", "IRAN", "RSF", "RSA", "JOR", "JORDAN", "EGY", "QAF", "QATARI", "UAEAF", "UNIFORCE", "SAUDI", "SAAF", "SUDAN", "VFA", "VFC", "CF", "CAF", "RCAF", "RCAF", "RAF", "ROYAL", "RNZAF", "NZAF", "SLAF",
  "IFC", "INDIAN", "U", "PAK", "PAF", "SHAHEEN", "BGL",
  "PLAAF", "ROCAF", "ROC", "ROK", "ROKAF", "KAF", "JF", "JASDF", "SINGA", "RSAF", "ASY", "AUSSIE", "KOR", "MAS", "RMAF", "IRA", "MAHAN AIR", "IAF", "IRM", "IRC", "QSM", "KIS",
  "RSD", "SUM", "TTF", "CHD", "RUBY", "CORAL", "UAF", "UKRAINE", "PLF", "POLISH", "BRF",
  "RCH", "REACH", "CNV", "CONVOY", "LAGR", "NCHO", "HOBO", "FORTE", "TEAL", "TITAN", "GHOST", "DEATH", "DOOM", "BONE", "VIPER", "VENOM", "JEDI", "VADER", "PIRATE", "BLAZE", "DRAKEN",
  "RRR", "ASCOT", "TARTAN", "REBEL", "HAVOC", "TYPHOON", "NATO", "GAF", "GERMAN", 
  "LUXAF", "BELAF", "SWAF", "SWISS", "FINAF", "DANAF", "NORAF", "ICELAND", "HUNAF", "CROAF", "SLVAF"
];

const isTactical = (callsign: string) => {
  if (!callsign) return false;
  const cs = callsign.trim().toUpperCase();
  return TACTICAL_CALLSIGNS.some(prefix => cs.startsWith(prefix));
};

export async function GET() {
  try {
    const response = await fetch('https://opensky-network.org/api/states/all', {
      next: { revalidate: 30 }
    });

    if (!response.ok) throw new Error('OpenSky API unreachable');

    const data = await response.json();

    // 1. PRIMARY HUNT: Filter for Tactical Callsigns + VALID LOCATION
    let flights = data.states
      .filter((s: any[]) => {
        // MUST have valid Lat (6) and Lon (5)
        const hasLocation = s[5] !== null && s[6] !== null; 
        return hasLocation && isTactical(s[1]);
      })
      .map((state: any[]) => ({
        id: state[0],
        callsign: (state[1] || "UNKNOWN").trim(),
        country: state[2],
        longitude: state[5],
        latitude: state[6],
        rotation: state[10] || 0,
        velocity: state[9] || 0,
        category: "TACTICAL"
      }));

    // 2. BACKUP DRAGNET: Geographic Hotspots (Null-Safe)
    if (flights.length < 50) {
      const conflictZones = data.states.filter((s: any[]) => {
         // Safety Checks
         if (!s[5] || !s[6]) return false; // Skip ghosts
         if (isTactical(s[1])) return false; // Already caught

         const lat = s[6];
         const lon = s[5];

         // Kashmir (India/Pak)
         const isKashmir = (lat > 32 && lat < 36) && (lon > 73 && lon < 78);
         // Taiwan Strait
         const isTaiwan = (lat > 21 && lat < 27) && (lon > 118 && lon < 123);
         // Israel / Gaza / Sinai
         const isLevant = (lat > 29 && lat < 34) && (lon > 33 && lon < 37);
         // Ukraine / Black Sea
         const isUkraine = (lat > 44 && lat < 52) && (lon > 25 && lon < 40);

         return isKashmir || isTaiwan || isLevant || isUkraine;
      })
      .slice(0, 100)
      .map((state: any[]) => ({
          id: state[0],
          callsign: (state[1] || "CLFD").trim(),
          country: state[2],
          longitude: state[5],
          latitude: state[6],
          rotation: state[10] || 0,
          velocity: state[9] || 0,
          category: "UNCERTAIN"
      }));

      flights = [...flights, ...conflictZones];
    }

    return NextResponse.json({ 
      count: flights.length, 
      flights: flights 
    });

  } catch (error) {
    return NextResponse.json({ error: "Radar Offline" }, { status: 500 });
  }
}