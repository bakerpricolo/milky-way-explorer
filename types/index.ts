// ─── Gaia Catalog ─────────────────────────────────────────────────────────────

export interface GaiaStar {
  source_id: string;
  ra: number;
  dec: number;
  parallax: number | null;
  pmra: number | null;
  pmdec: number | null;
  phot_g_mean_mag: number | null;
  bp_rp: number | null;
  teff_val: number | null;
  radial_velocity: number | null;
  l: number | null;
  b: number | null;
}

// ─── Spectrum ─────────────────────────────────────────────────────────────────

export interface SpectrumData {
  wavelengths: number[];
  flux: number[];
  source: "sdss" | "synthetic";
  specObjID?: string;
}

// ─── Bookmarks ────────────────────────────────────────────────────────────────

export interface Bookmark {
  id: string;
  user_id: string;
  star_id: string;
  star_name: string | null;
  ra: number | null;
  dec: number | null;
  magnitude: number | null;
  temperature: number | null;
  distance_pc: number | null;
  notes: string | null;
  created_at: string;
}

// ─── Gaia TAP response ────────────────────────────────────────────────────────

export interface GaiaTapResponse {
  metadata: Array<{ name: string; datatype: string }>;
  data: Array<Array<string | number | null>>;
}

// ─── User ─────────────────────────────────────────────────────────────────────

export interface AppUser {
  id: string;
  email: string | null;
  avatar_url: string | null;
  user_metadata: Record<string, unknown>;
}

// ─── Solar System ─────────────────────────────────────────────────────────────

export interface Planet {
  name: string;
  type: "rocky" | "gas-giant" | "ice-giant";
  color: string;
  radius: number;    // display radius (Three.js units)
  orbitRadius: number; // AU (will be scaled for display)
  periodDays: number;
  initialAngleDeg: number;
  tiltDeg: number;
  description: string;
  diameter_km: number;
  mass_earth: number;
  moons: number;
  dayLength: string;
  surfaceTemp: string;
  hasRings: boolean;
}

// ─── Exoplanets ───────────────────────────────────────────────────────────────

export interface Exoplanet {
  name: string;
  hostStar: string;
  ra: number;
  dec: number;
  distancePc: number;
  radiusEarth: number | null;
  periodDays: number | null;
  equilibriumTempK: number | null;
  insolation: number | null; // relative to Earth
  isHabitable: boolean;
}

// ─── Points of Interest ───────────────────────────────────────────────────────

export interface PointOfInterest {
  id: string;
  name: string;
  type: "star-system" | "nebula" | "cluster" | "special";
  ra: number;
  dec: number;
  distancePc: number;
  description: string;
  emoji: string;
  color: string;
}
