// ─── Gaia Catalog ────────────────────────────────────────────────────────────

/** A real star from the Gaia DR3 catalog */
export interface GaiaStar {
  source_id: string;
  ra: number;               // Right ascension (degrees, J2000)
  dec: number;              // Declination (degrees, J2000)
  parallax: number | null;  // Parallax (milli-arcseconds)
  pmra: number | null;      // Proper motion in RA (mas/yr)
  pmdec: number | null;     // Proper motion in Dec (mas/yr)
  phot_g_mean_mag: number | null;  // Gaia G-band magnitude
  bp_rp: number | null;            // BP - RP colour index
  teff_val: number | null;         // Effective temperature (K)
  radial_velocity: number | null;  // Radial velocity (km/s)
  l: number | null;   // Galactic longitude (degrees)
  b: number | null;   // Galactic latitude (degrees)
}

// ─── Spectrum ────────────────────────────────────────────────────────────────

export interface SpectrumData {
  wavelengths: number[];   // nm
  flux: number[];          // normalized 0–1
  source: "sdss" | "synthetic";
  specObjID?: string;
}

// ─── Bookmarks ───────────────────────────────────────────────────────────────

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

// ─── Gaia API response ───────────────────────────────────────────────────────

export interface GaiaTapResponse {
  metadata: Array<{ name: string; datatype: string }>;
  data: Array<Array<string | number | null>>;
}

// ─── Store ───────────────────────────────────────────────────────────────────

export interface AppUser {
  id: string;
  email: string | null;
  avatar_url: string | null;
  user_metadata: Record<string, unknown>;
}
