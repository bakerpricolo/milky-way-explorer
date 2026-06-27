import type { GaiaStar, GaiaTapResponse } from "@/types";

// ─── Gaia DR3 TAP service ────────────────────────────────────────────────────

const GAIA_TAP = "https://gea.esac.esa.int/tap-server/tap/sync";

const COLUMNS = [
  "source_id", "ra", "dec", "parallax", "pmra", "pmdec",
  "phot_g_mean_mag", "bp_rp", "teff_val", "radial_velocity", "l", "b",
].join(", ");

/** ADQL query for bright nearby stars (initial load) */
const NEARBY_BRIGHT_QUERY = `
SELECT TOP 3000
  ${COLUMNS}
FROM gaiadr3.gaia_source
WHERE parallax IS NOT NULL
  AND parallax > 5
  AND parallax_over_error > 10
  AND phot_g_mean_mag IS NOT NULL
  AND phot_g_mean_mag < 10
ORDER BY phot_g_mean_mag ASC
`.trim();

/** Parse a raw Gaia TAP JSON response into typed GaiaStar objects. */
function parseTapResponse(data: GaiaTapResponse): GaiaStar[] {
  const cols = data.metadata.map((m) => m.name);
  return data.data.map((row) => {
    const obj: Record<string, string | number | null> = {};
    cols.forEach((col, i) => { obj[col] = row[i]; });
    return {
      source_id: String(obj.source_id),
      ra: Number(obj.ra),
      dec: Number(obj.dec),
      parallax: obj.parallax != null ? Number(obj.parallax) : null,
      pmra: obj.pmra != null ? Number(obj.pmra) : null,
      pmdec: obj.pmdec != null ? Number(obj.pmdec) : null,
      phot_g_mean_mag: obj.phot_g_mean_mag != null ? Number(obj.phot_g_mean_mag) : null,
      bp_rp: obj.bp_rp != null ? Number(obj.bp_rp) : null,
      teff_val: obj.teff_val != null ? Number(obj.teff_val) : null,
      radial_velocity: obj.radial_velocity != null ? Number(obj.radial_velocity) : null,
      l: obj.l != null ? Number(obj.l) : null,
      b: obj.b != null ? Number(obj.b) : null,
    } satisfies GaiaStar;
  });
}

/**
 * Fetch a batch of bright nearby stars from the Gaia TAP service.
 * Used server-side (API route) to avoid CORS.
 */
export async function fetchNearbyStars(): Promise<GaiaStar[]> {
  const params = new URLSearchParams({
    REQUEST: "doQuery",
    LANG: "ADQL",
    FORMAT: "json",
    QUERY: NEARBY_BRIGHT_QUERY,
  });

  const res = await fetch(`${GAIA_TAP}?${params}`, {
    headers: { Accept: "application/json" },
    next: { revalidate: 86_400 }, // Cache for 24 h on the server
  });

  if (!res.ok) throw new Error(`Gaia TAP error: ${res.status}`);
  const data: GaiaTapResponse = await res.json();
  return parseTapResponse(data);
}

/**
 * Search Gaia for a star by source_id (used in API route).
 */
export async function fetchStarById(sourceId: string): Promise<GaiaStar | null> {
  const query = `
    SELECT ${COLUMNS}
    FROM gaiadr3.gaia_source
    WHERE source_id = ${sourceId}
  `.trim();

  const params = new URLSearchParams({
    REQUEST: "doQuery",
    LANG: "ADQL",
    FORMAT: "json",
    QUERY: query,
  });

  const res = await fetch(`${GAIA_TAP}?${params}`, {
    headers: { Accept: "application/json" },
  });

  if (!res.ok) return null;
  const data: GaiaTapResponse = await res.json();
  const stars = parseTapResponse(data);
  return stars[0] ?? null;
}

// ─── SIMBAD (name search) ────────────────────────────────────────────────────

const SIMBAD_TAP = "https://simbad.u-strasbg.fr/simbad/tap/sync";

interface SimbadResult {
  main_id: string;
  ra: number;
  dec: number;
}

/**
 * Search SIMBAD for stars matching a name query.
 * Returns basic position data; callers must cross-match to Gaia separately.
 */
export async function searchByName(name: string): Promise<SimbadResult[]> {
  // Use CDS Sesame name resolver — the most reliable way to look up star names
  try {
    const sesameUrl = `https://cdsweb.u-strasbg.fr/cgi-bin/nph-sesame/-oxj/SNV?${encodeURIComponent(name)}`;
    const res = await fetch(sesameUrl, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(6_000),
    });

    if (res.ok) {
      const text = await res.text();
      // Sesame returns JSONP-like text, parse the JSON portion
      const match = text.match(/\{[\s\S]*\}/);
      if (match) {
        const data = JSON.parse(match[0]);
        const resolvers = data?.Target?.Resolver ?? [];
        const results: SimbadResult[] = [];
        for (const r of resolvers) {
          if (r.jradeg != null && r.jdedeg != null) {
            results.push({
              main_id: r.oname ?? name,
              ra:  Number(r.jradeg),
              dec: Number(r.jdedeg),
            });
          }
        }
        if (results.length > 0) return results;
      }
    }
  } catch { /* fall through to SIMBAD TAP */ }

  // Fallback: SIMBAD TAP with simple LIKE search
  const safeName = name.replace(/'/g, "''");
  const query = `SELECT TOP 10 main_id, ra, dec FROM basic WHERE main_id LIKE '%${safeName}%' ORDER BY main_id`;

  const params = new URLSearchParams({
    REQUEST: "doQuery",
    LANG: "ADQL",
    FORMAT: "json",
    QUERY: query,
  });

  try {
    const res = await fetch(`${SIMBAD_TAP}?${params}`, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(6_000),
    });
    if (!res.ok) return [];
    const data: GaiaTapResponse = await res.json();
    const cols = data.metadata.map((m) => m.name);
    return data.data.map((row) => {
      const obj: Record<string, string | number | null> = {};
      cols.forEach((col, i) => { obj[col] = row[i]; });
      return {
        main_id: String(obj.main_id),
        ra: Number(obj.ra),
        dec: Number(obj.dec),
      };
    });
  } catch {
    return [];
  }
}

/**
 * Cross-match a RA/Dec position against Gaia DR3.
 * Useful after finding a named star in SIMBAD.
 */
export async function fetchStarByPosition(
  ra: number,
  dec: number,
  radiusDeg = 0.01
): Promise<GaiaStar | null> {
  const query = `
    SELECT TOP 1 ${COLUMNS}
    FROM gaiadr3.gaia_source
    WHERE CONTAINS(
      POINT('ICRS', ra, dec),
      CIRCLE('ICRS', ${ra}, ${dec}, ${radiusDeg})
    ) = 1
    ORDER BY phot_g_mean_mag ASC
  `.trim();

  const params = new URLSearchParams({
    REQUEST: "doQuery",
    LANG: "ADQL",
    FORMAT: "json",
    QUERY: query,
  });

  try {
    const res = await fetch(`${GAIA_TAP}?${params}`, {
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return null;
    const data: GaiaTapResponse = await res.json();
    const stars = parseTapResponse(data);
    return stars[0] ?? null;
  } catch {
    return null;
  }
}