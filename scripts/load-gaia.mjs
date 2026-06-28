/**
 * load-gaia.mjs — loads HYG star data into Supabase
 *
 * Usage:
 *   NEXT_PUBLIC_SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/load-gaia.mjs
 */

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BATCH_SIZE   = 500;
const MAX_MAG      = 9.5;

const HYG_URL = "https://raw.githubusercontent.com/astronexus/HYG-Database/main/hyg/CURRENT/hygdata_v41.csv";

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("❌  Missing env vars");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ─── Galactic coordinate conversion ──────────────────────────────────────────

const NGP_RA  = 192.85948 * Math.PI / 180;
const NGP_DEC =  27.12825 * Math.PI / 180;
const GC_LONG = 122.93192;

function equatorialToGalactic(raDeg, decDeg) {
  const raRad  = raDeg  * Math.PI / 180;
  const decRad = decDeg * Math.PI / 180;
  const sinB = Math.sin(decRad) * Math.sin(NGP_DEC)
             + Math.cos(decRad) * Math.cos(NGP_DEC) * Math.cos(raRad - NGP_RA);
  const b = Math.asin(Math.max(-1, Math.min(1, sinB))) * 180 / Math.PI;
  const y = Math.cos(decRad) * Math.sin(raRad - NGP_RA);
  const x = Math.sin(decRad) * Math.cos(NGP_DEC)
           - Math.cos(decRad) * Math.sin(NGP_DEC) * Math.cos(raRad - NGP_RA);
  const lCalc = Math.atan2(y, x) * 180 / Math.PI;
  const l = ((GC_LONG - lCalc) % 360 + 360) % 360;
  return { l, b };
}

function bvToTemperature(bv) {
  if (bv == null || isNaN(bv)) return null;
  const c = Math.max(-0.4, Math.min(bv, 2.0));
  return Math.round(4600 * (1 / (0.92 * c + 1.7) + 1 / (0.92 * c + 0.62)));
}

function bvToBpRp(bv) {
  if (bv == null || isNaN(bv)) return null;
  return +(1.3 * bv + 0.05).toFixed(3);
}

// ─── Download and parse ───────────────────────────────────────────────────────

console.log("\n🌌  Milky Way Explorer — star data loader\n");
console.log("📥  Downloading HYG star database…");

const res = await fetch(HYG_URL);
if (!res.ok) {
  console.error(`❌  Download failed: HTTP ${res.status}`);
  process.exit(1);
}

const text = await res.text();
const lines = text.split("\n");

// Normalise headers: lowercase + trim to handle any casing/whitespace
const rawHeaders = lines[0].split(",").map(h => h.trim().replace(/^"|"$/g, "").toLowerCase());
console.log(`\n📋  Headers found: ${rawHeaders.slice(0, 10).join(", ")}…`);

// Find column indices (try multiple name variants)
function findCol(...names) {
  for (const name of names) {
    const i = rawHeaders.indexOf(name.toLowerCase());
    if (i !== -1) return i;
  }
  return -1;
}

const iId    = findCol("id", "starid", "star_id");
const iHip   = findCol("hip", "hipparcosid");
const iRa    = findCol("ra");
const iDec   = findCol("dec");
const iDist  = findCol("dist", "distance");
const iPmRa  = findCol("pmra", "pm_ra");
const iPmDec = findCol("pmdec", "pmdec", "pm_dec");
const iMag   = findCol("mag", "vmag");
const iCi    = findCol("ci", "colorindex", "color_index", "b_v");
const iRv    = findCol("rv", "radialvelocity", "radial_velocity");

console.log(`\n🔍  Column mapping:`);
console.log(`    id=${iId} hip=${iHip} ra=${iRa} dec=${iDec} dist=${iDist}`);
console.log(`    pmra=${iPmRa} pmdec=${iPmDec} mag=${iMag} ci=${iCi} rv=${iRv}`);

if (iRa === -1 || iDec === -1 || iMag === -1) {
  console.error("\n❌  Could not find essential columns (ra, dec, mag)");
  console.error("    All headers:", rawHeaders.join(", "));
  process.exit(1);
}

// Parse rows
const stars = [];
let skipped = 0;

for (let i = 1; i < lines.length; i++) {
  const line = lines[i].trim();
  if (!line) continue;
  const cols = line.split(",").map(c => c.replace(/^"|"$/g, ""));

  const mag  = parseFloat(cols[iMag]);
  if (isNaN(mag) || mag > MAX_MAG) { skipped++; continue; }

  const raRaw = parseFloat(cols[iRa]);
  const dec   = parseFloat(cols[iDec]);
  const dist  = iDist !== -1 ? parseFloat(cols[iDist]) : null;

  if (isNaN(raRaw) || isNaN(dec)) continue;

  // HYG ra is in hours (0–24), convert to degrees
  const ra = raRaw <= 24 ? raRaw * 15 : raRaw;
  const parallax = (dist && dist > 0 && dist < 100000) ? 1000 / dist : null;
  const bv = iCi !== -1 ? parseFloat(cols[iCi]) : NaN;
  const { l, b } = equatorialToGalactic(ra, dec);

  const hip      = iHip !== -1 ? cols[iHip]?.trim() : "";
  const id       = iId  !== -1 ? cols[iId]?.trim()  : String(i);
  const sourceId = (hip && hip !== "") ? `HIP${hip}` : `HYG${id}`;

  stars.push({
    source_id:           sourceId,
    ra:                  +ra.toFixed(6),
    dec:                 +dec.toFixed(6),
    parallax:            parallax ? +parallax.toFixed(4) : null,
    parallax_over_error: null,
    pmra:                iPmRa  !== -1 && !isNaN(parseFloat(cols[iPmRa]))  ? +parseFloat(cols[iPmRa]).toFixed(4)  : null,
    pmdec:               iPmDec !== -1 && !isNaN(parseFloat(cols[iPmDec])) ? +parseFloat(cols[iPmDec]).toFixed(4) : null,
    phot_g_mean_mag:     +mag.toFixed(3),
    bp_rp:               bvToBpRp(isNaN(bv) ? null : bv),
    teff_val:            bvToTemperature(isNaN(bv) ? null : bv),
    radial_velocity:     iRv !== -1 && !isNaN(parseFloat(cols[iRv])) ? +parseFloat(cols[iRv]).toFixed(2) : null,
    l:                   +l.toFixed(4),
    b:                   +b.toFixed(4),
  });
}

console.log(`\n✅  Parsed: ${stars.length.toLocaleString()} stars (skipped ${skipped.toLocaleString()} fainter than mag ${MAX_MAG})`);

if (stars.length === 0) {
  console.error("❌  No stars parsed — check column mapping above");
  process.exit(1);
}

// Insert into Supabase
console.log(`📤  Inserting into Supabase…\n`);
let inserted = 0;

for (let i = 0; i < stars.length; i += BATCH_SIZE) {
  const chunk = stars.slice(i, i + BATCH_SIZE);
  const { error } = await supabase
    .from("stars")
    .upsert(chunk, { onConflict: "source_id" });

  if (error) {
    console.error(`\n❌  Supabase error: ${error.message}`);
    console.error("    First row sample:", JSON.stringify(chunk[0]));
    process.exit(1);
  }

  inserted += chunk.length;
  const pct = Math.round((inserted / stars.length) * 100);
  process.stdout.write(`   ${inserted.toLocaleString()} / ${stars.length.toLocaleString()} (${pct}%)\r`);
}

console.log(`\n\n✅  Done! ${inserted.toLocaleString()} stars loaded into Supabase. 🚀\n`);
