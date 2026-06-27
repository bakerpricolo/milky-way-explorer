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
