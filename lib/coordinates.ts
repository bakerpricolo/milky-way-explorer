/**
 * Astronomical coordinate utilities.
 *
 * Gaia provides galactic longitude (l) and latitude (b) in degrees,
 * and parallax in milli-arcseconds.  This module converts those into
 * the Three.js galactocentric Cartesian frame used by the visualisation.
 *
 * Three.js convention:   Y = north galactic pole (up)
 * Units:                 kiloparsecs (kpc)
 * Sun position:          (8.5, 0, 0) kpc from galactic centre
 */

const SUN_GALACTOCENTRIC_DIST_KPC = 8.5; // IAU 2012 value

/**
 * Convert Gaia (l, b, parallax) to Three.js world coordinates.
 *
 * @param l        Galactic longitude  (degrees)
 * @param b        Galactic latitude   (degrees)
 * @param parallax Parallax            (milli-arcseconds)
 * @returns        {x, y, z}          in kpc, galactocentric
 */
export function galacticToXYZ(
  l: number,
  b: number,
  parallax: number
): { x: number; y: number; z: number } {
  // Distance from parallax (mas → pc → kpc)
  const distPc  = 1_000 / parallax; // mas → parsecs
  const distKpc = distPc / 1_000;

  // Cap at 5 kpc to avoid extreme positional errors for small parallaxes
  const d = Math.min(distKpc, 5);

  const lRad = (l * Math.PI) / 180;
  const bRad = (b * Math.PI) / 180;

  // Heliocentric Cartesian (galactic frame):
  //   x̂  = toward galactic centre  (l = 0°)
  //   ŷ  = toward l = 90°
  //   ẑ  = north galactic pole
  const dx = d * Math.cos(bRad) * Math.cos(lRad);
  const dy = d * Math.cos(bRad) * Math.sin(lRad);
  const dz = d * Math.sin(bRad);

  // Galactocentric (Sun is at +8.5 kpc along x̂):
  const xGC = SUN_GALACTOCENTRIC_DIST_KPC - dx;
  const yGC = dy;
  const zGC = dz;

  // Map to Three.js: Y = up (north pole), X and Z in the disk plane
  return { x: xGC, y: zGC, z: yGC };
}

/**
 * Distance in parsecs from Gaia parallax.
 * Returns null if parallax is non-positive.
 */
export function parallaxToDistance(parallaxMas: number): number | null {
  if (parallaxMas <= 0) return null;
  return 1_000 / parallaxMas;
}

/**
 * Format a distance in parsecs for display.
 */
export function formatDistance(pc: number): string {
  if (pc < 10)   return `${pc.toFixed(2)} pc`;
  if (pc < 1000) return `${pc.toFixed(1)} pc`;
  return `${(pc / 1000).toFixed(2)} kpc`;
}

/**
 * Format proper motion for display.
 */
export function formatPM(mas_yr: number): string {
  return `${mas_yr.toFixed(3)} mas/yr`;
}

// ─── Equatorial → Galactic conversion ────────────────────────────────────────

const _NGP_RA  = 192.85948 * Math.PI / 180;
const _NGP_DEC =  27.12825 * Math.PI / 180;
const _GC_LONG = 122.93192;

export function equatorialToGalactic(raDeg: number, decDeg: number): { l: number; b: number } {
  const raRad  = raDeg  * Math.PI / 180;
  const decRad = decDeg * Math.PI / 180;
  const sinB   = Math.sin(decRad) * Math.sin(_NGP_DEC)
               + Math.cos(decRad) * Math.cos(_NGP_DEC) * Math.cos(raRad - _NGP_RA);
  const b      = Math.asin(Math.max(-1, Math.min(1, sinB))) * 180 / Math.PI;
  const y      = Math.cos(decRad) * Math.sin(raRad - _NGP_RA);
  const x      = Math.sin(decRad) * Math.cos(_NGP_DEC)
               - Math.cos(decRad) * Math.sin(_NGP_DEC) * Math.cos(raRad - _NGP_RA);
  const lCalc  = Math.atan2(y, x) * 180 / Math.PI;
  const l      = ((_GC_LONG - lCalc) % 360 + 360) % 360;
  return { l, b };
}

/**
 * Convert equatorial coordinates + distance (parsecs) to Three.js galactocentric XYZ.
 */
export function equatorialToXYZ(raDeg: number, decDeg: number, distPc: number) {
  const { l, b } = equatorialToGalactic(raDeg, decDeg);
  const parallaxMas = 1000 / distPc;
  return galacticToXYZ(l, b, parallaxMas);
}

// ─── Habitable zone calculation ───────────────────────────────────────────────

/**
 * Estimate stellar luminosity relative to Sun from effective temperature.
 * Uses main-sequence mass-luminosity relation approximation.
 */
function estimateLuminosity(teffK: number): number {
  const tRatio = teffK / 5778; // Sun temperature
  // Approximate: L ∝ T^4 * R^2, R ∝ T^0.8 for main sequence
  return Math.pow(tRatio, 4) * Math.pow(tRatio, 1.6);
}

/**
 * Calculate habitable zone inner and outer boundaries in AU.
 * Uses Kopparapu et al. (2013) approximation.
 */
export function habitableZoneAU(teffK: number): { inner: number; outer: number } {
  const L   = estimateLuminosity(teffK);
  const inner = Math.sqrt(L / 1.1);
  const outer = Math.sqrt(L / 0.53);
  return { inner: +inner.toFixed(2), outer: +outer.toFixed(2) };
}
