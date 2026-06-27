/**
 * Milky Way procedural generator.
 * Produces a realistic 4-arm logarithmic spiral galaxy using
 * physically-motivated distributions for star counts, temperatures, and positions.
 *
 * Coordinate system: galactocentric, Y = north galactic pole (out of disk).
 * Units: kiloparsecs (kpc). Sun is placed at (8.5, 0, 0).
 */

// ─── Parameters ──────────────────────────────────────────────────────────────

const NUM_STARS = 200_000;
const NUM_ARMS = 4;
const ARM_TIGHTNESS = 0.25;   // logarithmic spiral b parameter
const ARM_SCALE = 3.0;         // radial scale of arms (kpc)
const MAX_ANGLE = 4 * Math.PI; // arms wind 2 full turns
const ARM_WIDTH = 0.45;        // scatter perpendicular to arm (kpc)
const DISK_HEIGHT = 0.20;      // thin disk scale height (kpc)
const GALAXY_RADIUS = 14;      // cutoff radius (kpc)
const BULGE_RADIUS = 2.0;      // half-light radius of bulge (kpc)

const BULGE_FRACTION = 0.15;   // fraction of stars in bulge
const DISK_FRACTION = 0.20;    // fraction in smooth disk (rest in arms)

// ─── Math helpers ────────────────────────────────────────────────────────────

/** Box-Muller Gaussian with σ=1 */
function gaussian(): number {
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

// ─── Stellar temperature → RGB ────────────────────────────────────────────────

/**
 * Maps an effective temperature to a visually accurate RGB colour
 * using the approximate Planckian locus.
 */
export function temperatureToRGB(temp: number): [number, number, number] {
  if (temp >= 30_000) return [0.60, 0.70, 1.00]; // O – blue
  if (temp >= 10_000) return [0.67, 0.75, 1.00]; // B – blue-white
  if (temp >=  7_500) return [0.80, 0.87, 1.00]; // A – white-blue
  if (temp >=  6_000) return [0.97, 0.96, 0.95]; // F – white-yellow
  if (temp >=  5_200) return [1.00, 0.90, 0.72]; // G – yellow (like Sun)
  if (temp >=  3_700) return [1.00, 0.68, 0.38]; // K – orange
  return [1.00, 0.45, 0.25];                      // M – red
}

/**
 * Rough conversion from Gaia BP–RP colour to effective temperature.
 * Fit from Mann et al. 2015 / Ramirez & Melendez 2005.
 */
export function bpRpToTemperature(bpRp: number): number {
  // Polynomial approximation valid ~0.5 to 5 mag
  const bp = Math.max(0.3, Math.min(bpRp, 5.0));
  return Math.round(
    5040 / (0.4963 + 0.5966 * bp - 0.0816 * bp * bp + 0.00377 * bp * bp * bp)
  );
}

// ─── Position generators ─────────────────────────────────────────────────────

/** King-profile bulge star (flattened ellipsoid). */
function bulgePosition(): [number, number, number] {
  const r = Math.abs(gaussian()) * BULGE_RADIUS;
  const theta = Math.random() * 2 * Math.PI;
  const phi = Math.acos(2 * Math.random() - 1);
  return [
    r * Math.sin(phi) * Math.cos(theta),
    r * Math.cos(phi) * 0.35, // flatten
    r * Math.sin(phi) * Math.sin(theta),
  ];
}

/** Exponential thin disk star (random azimuth). */
function diskPosition(): [number, number, number] {
  // Exponential radial profile with scale length ~3 kpc
  const r = -3 * Math.log(1 - Math.random() * 0.99) * 0.8;
  if (r > GALAXY_RADIUS) return diskPosition();
  const theta = Math.random() * 2 * Math.PI;
  const y = gaussian() * DISK_HEIGHT;
  return [r * Math.cos(theta), y, r * Math.sin(theta)];
}

/** Star on a logarithmic spiral arm. */
function armPosition(armIndex: number): [number, number, number] {
  const armOffset = (armIndex / NUM_ARMS) * 2 * Math.PI;
  // Biased toward inner arms
  const t = Math.pow(Math.random(), 0.4);
  const angle = t * MAX_ANGLE + armOffset;
  // Logarithmic spiral: r = scale * exp(b * angle_from_inner_start)
  const r = ARM_SCALE * Math.exp(ARM_TIGHTNESS * t * 4);
  if (r > GALAXY_RADIUS) return armPosition(armIndex);

  // Scatter perpendicular to arm tangent
  const scatter = ARM_WIDTH * (1 + t * 0.5) * gaussian() * 0.3;
  const x = (r + scatter) * Math.cos(angle);
  const z = (r + scatter) * Math.sin(angle);
  const y = gaussian() * DISK_HEIGHT * 0.6;
  return [x, y, z];
}

// ─── Main generator ──────────────────────────────────────────────────────────

export interface GalaxyBuffers {
  positions: Float32Array; // x,y,z per star
  colors: Float32Array;    // r,g,b per star
  sizes: Float32Array;     // point size per star
}

export function generateGalaxy(): GalaxyBuffers {
  const positions = new Float32Array(NUM_STARS * 3);
  const colors    = new Float32Array(NUM_STARS * 3);
  const sizes     = new Float32Array(NUM_STARS);

  for (let i = 0; i < NUM_STARS; i++) {
    let pos: [number, number, number];
    let temp: number;
    let size: number;

    const roll = Math.random();

    if (roll < BULGE_FRACTION) {
      // Bulge: old red/orange stars
      pos  = bulgePosition();
      temp = 3_200 + Math.random() * 2_800;
      size = 0.020 + Math.random() * 0.020;
    } else if (roll < BULGE_FRACTION + DISK_FRACTION) {
      // Smooth disk: mixed ages
      pos  = diskPosition();
      temp = 4_000 + Math.random() * 4_000;
      size = 0.015 + Math.random() * 0.015;
    } else {
      // Spiral arms: young hot stars dominate, some cooler
      const arm = Math.floor(Math.random() * NUM_ARMS);
      pos = armPosition(arm);
      // Bimodal: ~30% blue OB stars, rest mixed
      temp = Math.random() < 0.3
        ? 8_000 + Math.random() * 22_000  // hot blue
        : 4_500 + Math.random() * 5_000;  // cool/warm
      size = 0.018 + Math.random() * 0.022;
    }

    positions[i * 3]     = pos[0];
    positions[i * 3 + 1] = pos[1];
    positions[i * 3 + 2] = pos[2];

    const [r, g, b] = temperatureToRGB(temp);
    colors[i * 3]     = r;
    colors[i * 3 + 1] = g;
    colors[i * 3 + 2] = b;

    sizes[i] = size;
  }

  return { positions, colors, sizes };
}
