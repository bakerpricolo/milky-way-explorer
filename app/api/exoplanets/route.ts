import { NextResponse } from "next/server";
import type { Exoplanet } from "@/types";
import { equatorialToGalactic } from "@/lib/coordinates";

// Fallback hardcoded exoplanets (always available even if NASA is down)
const FALLBACK_EXOPLANETS: Exoplanet[] = [
  { name: "Proxima b",     hostStar: "Proxima Centauri", ra: 217.429, dec: -62.679, distancePc: 1.30,  radiusEarth: 1.07, periodDays: 11.2,   equilibriumTempK: 234, insolation: 0.65, isHabitable: true  },
  { name: "TRAPPIST-1e",   hostStar: "TRAPPIST-1",       ra: 346.623, dec: -5.042,  distancePc: 12.40, radiusEarth: 0.91, periodDays: 6.1,    equilibriumTempK: 251, insolation: 0.66, isHabitable: true  },
  { name: "TRAPPIST-1f",   hostStar: "TRAPPIST-1",       ra: 346.623, dec: -5.042,  distancePc: 12.40, radiusEarth: 1.04, periodDays: 9.2,    equilibriumTempK: 219, insolation: 0.38, isHabitable: true  },
  { name: "Tau Ceti e",    hostStar: "Tau Ceti",          ra: 26.017,  dec: -15.937, distancePc: 3.65,  radiusEarth: 2.0,  periodDays: 162.9,  equilibriumTempK: 288, insolation: 1.05, isHabitable: true  },
  { name: "Wolf 1061 c",   hostStar: "Wolf 1061",         ra: 244.394, dec: -12.553, distancePc: 4.31,  radiusEarth: 1.64, periodDays: 17.9,   equilibriumTempK: 272, insolation: 0.88, isHabitable: true  },
  { name: "GJ 667C c",     hostStar: "GJ 667C",           ra: 259.750, dec: -34.993, distancePc: 6.84,  radiusEarth: 1.54, periodDays: 28.1,   equilibriumTempK: 277, insolation: 0.88, isHabitable: true  },
  { name: "51 Peg b",      hostStar: "51 Pegasi",         ra: 344.366, dec: 20.769,  distancePc: 15.60, radiusEarth: 12.7, periodDays: 4.2,    equilibriumTempK: 1285,insolation: null, isHabitable: false },
  { name: "55 Cnc e",      hostStar: "55 Cancri",         ra: 133.149, dec: 28.330,  distancePc: 12.53, radiusEarth: 1.88, periodDays: 0.74,   equilibriumTempK: 2360,insolation: null, isHabitable: false },
  { name: "HD 40307 g",    hostStar: "HD 40307",          ra: 89.162,  dec: -60.030, distancePc: 12.83, radiusEarth: 2.4,  periodDays: 197.8,  equilibriumTempK: 226, insolation: 0.70, isHabitable: true  },
  { name: "Kepler-442b",   hostStar: "Kepler-442",        ra: 294.882, dec: 39.647,  distancePc: 342.0, radiusEarth: 1.34, periodDays: 112.3,  equilibriumTempK: 233, insolation: 0.70, isHabitable: true  },
  { name: "K2-18b",        hostStar: "K2-18",             ra: 172.560, dec: 11.728,  distancePc: 38.0,  radiusEarth: 2.37, periodDays: 32.9,   equilibriumTempK: 265, insolation: 0.97, isHabitable: true  },
  { name: "LHS 1140b",     hostStar: "LHS 1140",          ra: 17.617,  dec: -15.276, distancePc: 14.99, radiusEarth: 1.73, periodDays: 24.7,   equilibriumTempK: 235, insolation: 0.46, isHabitable: true  },
];

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const query = encodeURIComponent(
      "select top 300 pl_name,hostname,ra,dec,sy_dist,pl_rade,pl_orbper,pl_eqt,pl_insol from pscomppars where sy_dist is not null and sy_dist < 500 order by sy_dist asc"
    );

    const res = await fetch(
      `https://exoplanetarchive.ipac.caltech.edu/TAP/sync?query=${query}&format=json`,
      { headers: { Accept: "application/json" }, signal: AbortSignal.timeout(8_000) }
    );

    if (!res.ok) throw new Error(`NASA API HTTP ${res.status}`);

    const raw = await res.json() as Array<Record<string, string | number | null>>;

    const exoplanets: Exoplanet[] = raw
      .filter((r) => r.ra != null && r.dec != null && r.sy_dist != null)
      .map((r) => {
        const dist = Number(r.sy_dist);
        const insolation = r.pl_insol != null ? Number(r.pl_insol) : null;
        const eqt = r.pl_eqt != null ? Number(r.pl_eqt) : null;
        const isHabitable =
          insolation != null && insolation > 0.2 && insolation < 2.0 &&
          (r.pl_rade == null || Number(r.pl_rade) < 2.5);

        return {
          name:             String(r.pl_name),
          hostStar:         String(r.hostname ?? ""),
          ra:               Number(r.ra),
          dec:              Number(r.dec),
          distancePc:       dist,
          radiusEarth:      r.pl_rade != null ? Number(r.pl_rade) : null,
          periodDays:       r.pl_orbper != null ? Number(r.pl_orbper) : null,
          equilibriumTempK: eqt,
          insolation,
          isHabitable,
        };
      });

    return NextResponse.json(
      { exoplanets, count: exoplanets.length, source: "nasa" },
      { headers: { "Cache-Control": "public, s-maxage=3600" } }
    );
  } catch {
    return NextResponse.json(
      { exoplanets: FALLBACK_EXOPLANETS, count: FALLBACK_EXOPLANETS.length, source: "fallback" },
      { headers: { "Cache-Control": "no-store" } }
    );
  }
}
