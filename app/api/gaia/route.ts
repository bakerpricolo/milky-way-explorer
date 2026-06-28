import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  fetchStarById,
  fetchStarByPosition,
  searchByName,
} from "@/lib/gaia";

// ─── Fallback stars (shown if Supabase stars table is empty) ─────────────────

const FALLBACK_STARS = [
  { source_id: "2947050466531873024", ra: 101.2872, dec: -16.7161, parallax: 379.21, pmra: -546.05, pmdec: -1223.14, phot_g_mean_mag: -1.46, bp_rp: 0.00, teff_val: 9940, radial_velocity: -5.5,  l: 227.23, b: -8.89 },
  { source_id: "5853498713190525696", ra: 213.9153, dec: 19.1822,  parallax: 88.83,  pmra: -1093.4, pmdec: -1999.4, phot_g_mean_mag: -0.05, bp_rp: 1.53, teff_val: 4286, radial_velocity: -122.1, l: 12.88,  b: 68.33 },
  { source_id: "4472832130942575872", ra: 279.2347, dec: 38.7836,  parallax: 128.93, pmra: 536.82,  pmdec: 385.54,  phot_g_mean_mag: 0.03,  bp_rp: 0.78, teff_val: 7760, radial_velocity: -26.3, l: 62.16,  b: 13.35 },
  { source_id: "6056164455500208128", ra: 95.9879,  dec: -52.6957, parallax: 10.43,  pmra: -19.99,  pmdec: 22.72,   phot_g_mean_mag: 0.42,  bp_rp: 1.60, teff_val: 3760, radial_velocity: 17.8,  l: 263.40, b: -28.97 },
  { source_id: "4043800375492625920", ra: 78.6344,  dec: 45.9980,  parallax: 77.29,  pmra: 440.94,  pmdec: -88.43,  phot_g_mean_mag: 0.76,  bp_rp: 1.43, teff_val: 4593, radial_velocity: 30.2,  l: 162.59, b: 4.57  },
  { source_id: "6779462288787814400", ra: 83.8221,  dec: -5.3911,  parallax: 3.70,   pmra: 1.48,    pmdec: 0.56,    phot_g_mean_mag: 0.42,  bp_rp: 1.85, teff_val: 3500, radial_velocity: 21.0,  l: 209.53, b: -19.61 },
  { source_id: "2918190400024578176", ra: 68.9799,  dec: 16.5093,  parallax: 54.26,  pmra: 107.40,  pmdec: -74.61,  phot_g_mean_mag: 0.87,  bp_rp: 1.44, teff_val: 5770, radial_velocity: 38.4,  l: 179.93, b: -23.61 },
  { source_id: "2021468729365951744", ra: 297.6958, dec: 8.8683,   parallax: 38.36,  pmra: 596.05,  pmdec: 385.29,  phot_g_mean_mag: 0.76,  bp_rp: 0.83, teff_val: 7600, radial_velocity: -26.3, l: 48.63,  b: -8.91 },
  { source_id: "4638789699729372800", ra: 201.2982, dec: -11.1613, parallax: 11.30,  pmra: -234.32, pmdec: -412.13, phot_g_mean_mag: 2.75,  bp_rp: 1.09, teff_val: 5300, radial_velocity: -149.4,l: 316.45, b: 51.03 },
  { source_id: "2061320004631397632", ra: 310.3580, dec: 45.2803,  parallax: 3.55,   pmra: 2.01,    pmdec: -0.90,   phot_g_mean_mag: 1.25,  bp_rp: 1.50, teff_val: 7650, radial_velocity: -21.6, l: 84.22,  b: -8.63 },
  { source_id: "4087252715017011456", ra: 84.0534,  dec: 45.9980,  parallax: 4.22,   pmra: 1.36,    pmdec: -0.57,   phot_g_mean_mag: 1.64,  bp_rp: 0.05, teff_val: 25500,radial_velocity: 14.0,  l: 166.46, b: 6.22  },
  { source_id: "3374393697054586240", ra: 186.6496, dec: -63.0990, parallax: 9.73,   pmra: -35.37,  pmdec: 14.99,   phot_g_mean_mag: 1.33,  bp_rp: 1.53, teff_val: 4159, radial_velocity: -1.0,  l: 299.65, b: -0.63 },
  { source_id: "6155541030060471680", ra: 247.3519, dec: -26.4320, parallax: 8.91,   pmra: -12.11,  pmdec: -23.02,  phot_g_mean_mag: 1.63,  bp_rp: 1.74, teff_val: 3620, radial_velocity: -3.2,  l: 353.22, b: 17.72 },
  { source_id: "4476705521381010432", ra: 344.4127, dec: -29.6223, parallax: 16.84,  pmra: 327.68,  pmdec: -164.67, phot_g_mean_mag: 1.73,  bp_rp: 1.08, teff_val: 5212, radial_velocity: -12.5, l: 18.44,  b: -65.37 },
  { source_id: "6681944812977249280", ra: 191.9303, dec: -59.6883, parallax: 6.21,   pmra: -46.20,  pmdec: 12.31,   phot_g_mean_mag: 1.94,  bp_rp: 1.55, teff_val: 3900, radial_velocity: -3.8,  l: 303.37, b: 2.73  },
  { source_id: "5597645982038933504", ra: 114.8255, dec: 5.2248,   parallax: 3.63,   pmra: -3.78,   pmdec: -1.33,   phot_g_mean_mag: 0.42,  bp_rp: 1.67, teff_val: 3500, radial_velocity: 22.2,  l: 215.55, b: 8.73  },
  { source_id: "4295806634045886080", ra: 177.2650, dec: -60.3740, parallax: 8.32,   pmra: -56.42,  pmdec: 13.60,   phot_g_mean_mag: 1.67,  bp_rp: 0.05, teff_val: 24000,radial_velocity: 11.0,  l: 294.74, b: 1.62  },
  { source_id: "4038137748277433344", ra: 88.7929,  dec: 7.4070,   parallax: 4.55,   pmra: 1.49,    pmdec: -0.69,   phot_g_mean_mag: 1.64,  bp_rp: 0.07, teff_val: 10500,radial_velocity: 5.0,   l: 201.35, b: -1.11 },
  { source_id: "2087032716912187136", ra: 322.1650, dec: -46.9608, parallax: 5.07,   pmra: 24.01,   pmdec: -147.47, phot_g_mean_mag: 1.94,  bp_rp: 1.55, teff_val: 3900, radial_velocity: 4.6,   l: 344.58, b: -41.76 },
  { source_id: "4295806634045886081", ra: 152.0929, dec: -59.6881, parallax: 37.35,  pmra: -159.47, pmdec: 48.20,   phot_g_mean_mag: 2.25,  bp_rp: 0.13, teff_val: 9700, radial_velocity: -14.2, l: 289.44, b: -4.94 },
];

/**
 * GET /api/gaia
 *
 * Query params:
 *   ?id=<source_id>               → single star by Gaia source_id
 *   ?ra=<deg>&dec=<deg>&radius=<> → nearest star to position
 *   ?search=<name>                → SIMBAD name search
 *   (none)                        → catalog load from Supabase stars table
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const id     = searchParams.get("id");
  const ra     = searchParams.get("ra");
  const dec    = searchParams.get("dec");
  const radius = searchParams.get("radius");
  const search = searchParams.get("search");

  try {
    // ── Single star by Gaia ID ────────────────────────────────────────────
    if (id) {
      // Check Supabase stars table first
      const supabase = await createClient();
      const { data } = await supabase
        .from("stars").select("*").eq("source_id", id).single();
      if (data) return NextResponse.json({ star: data });

      // Fall back to live Gaia query
      const star = await fetchStarById(id);
      if (!star) return NextResponse.json({ error: "Star not found" }, { status: 404 });
      return NextResponse.json({ star });
    }

    // ── Star by position ──────────────────────────────────────────────────
    if (ra && dec) {
      const raF = parseFloat(ra), decF = parseFloat(dec);
      const supabase = await createClient();

      // Rough bounding box search in Supabase
      const deg = radius ? parseFloat(radius) : 0.05;
      const { data } = await supabase
        .from("stars").select("*")
        .gte("ra",  raF  - deg).lte("ra",  raF  + deg)
        .gte("dec", decF - deg).lte("dec", decF + deg)
        .order("phot_g_mean_mag", { ascending: true })
        .limit(1);

      if (data && data.length > 0) return NextResponse.json({ star: data[0] });

      // Fall back to live Gaia query
      const star = await fetchStarByPosition(raF, decF, deg);
      if (!star) return NextResponse.json({ error: "No star found" }, { status: 404 });
      return NextResponse.json({ star });
    }

    // ── Name search ───────────────────────────────────────────────────────
    if (search) {
      if (search.length < 2) return NextResponse.json({ results: [] });
      try {
        const results = await searchByName(search);
        if (results.length > 0) return NextResponse.json({ results });
      } catch { /* fall through */ }

      // Fallback: match against known bright star names
      const lower = search.toLowerCase();
      const NAMED: Record<string, string> = {
        sirius: "2947050466531873024", canopus: "5853498713190525696",
        arcturus: "4472832130942575872", vega: "2021468729365951744",
        capella: "4043800375492625920", rigel: "6056164455500208128",
        betelgeuse: "6779462288787814400", procyon: "2918190400024578176",
        achernar: "4638789699729372800", altair: "2061320004631397632",
      };
      const matched = Object.entries(NAMED)
        .filter(([name]) => name.includes(lower))
        .map(([name, sid]) => {
          const s = FALLBACK_STARS.find((f) => f.source_id === sid);
          return s ? { name, ra: s.ra, dec: s.dec } : null;
        })
        .filter(Boolean);
      return NextResponse.json({ results: matched });
    }

    // ── Default: load catalog from Supabase stars table ───────────────────
    const supabase = await createClient();
    const { data: stars, error } = await supabase
      .from("stars")
      .select("*")
      .order("phot_g_mean_mag", { ascending: true })
      .range(0,4999);

    if (!error && stars && stars.length > 0) {
      return NextResponse.json(
        { stars, count: stars.length },
        { headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" } }
      );
    }

    // Stars table empty — use fallback hardcoded bright stars
    console.warn("[/api/gaia] stars table empty, using fallback");
    return NextResponse.json(
      { stars: FALLBACK_STARS, count: FALLBACK_STARS.length, fallback: true },
      { headers: { "Cache-Control": "no-store" } }
    );

  } catch (err) {
    console.error("[/api/gaia]", err);
    return NextResponse.json(
      { stars: FALLBACK_STARS, count: FALLBACK_STARS.length, fallback: true }
    );
  }
}
