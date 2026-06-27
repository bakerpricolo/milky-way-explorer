"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, Bookmark, BookmarkCheck, ExternalLink,
  Star, Thermometer, Gauge, Navigation, Zap,
} from "lucide-react";
import { useStore } from "@/lib/store";
import { bpRpToTemperature } from "@/lib/galaxy";
import { parallaxToDistance, formatDistance, formatPM } from "@/lib/coordinates";
import SpectrumChart from "./SpectrumChart";
import type { GaiaStar } from "@/types";

// ─── Data row helper ──────────────────────────────────────────────────────────

function DataRow({
  label,
  value,
  unit,
  icon: Icon,
}: {
  label: string;
  value: string | number | null | undefined;
  unit?: string;
  icon?: React.ElementType;
}) {
  if (value == null) return null;
  return (
    <div className="flex items-start justify-between gap-2 py-1.5 border-b border-white/5">
      <div className="flex items-center gap-1.5 text-slate-400 text-xs shrink-0">
        {Icon && <Icon className="w-3 h-3" />}
        <span>{label}</span>
      </div>
      <span className="text-right font-mono text-xs text-star-white">
        {value}{unit ? <span className="text-slate-500 ml-1">{unit}</span> : null}
      </span>
    </div>
  );
}

// ─── Spectral type from temperature ──────────────────────────────────────────

function spectralType(temp: number): string {
  if (temp >= 30000) return "O";
  if (temp >= 10000) return "B";
  if (temp >= 7500)  return "A";
  if (temp >= 6000)  return "F";
  if (temp >= 5200)  return "G";
  if (temp >= 3700)  return "K";
  return "M";
}

// ─── Bookmark button ──────────────────────────────────────────────────────────

function BookmarkButton({ star }: { star: GaiaStar }) {
  const { user, bookmarks, addBookmark, removeBookmark, setAuthModalOpen } = useStore();
  const isBookmarked = bookmarks.some((b) => b.star_id === star.source_id);
  const [loading, setLoading] = useState(false);

  const toggle = async () => {
    if (!user) { setAuthModalOpen(true); return; }
    setLoading(true);
    try {
      if (isBookmarked) {
        await fetch(`/api/bookmarks?star_id=${star.source_id}`, { method: "DELETE" });
        removeBookmark(star.source_id);
      } else {
        const res = await fetch("/api/bookmarks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            star_id:     star.source_id,
            ra:          star.ra,
            dec:         star.dec,
            magnitude:   star.phot_g_mean_mag,
            temperature: star.teff_val,
            distance_pc: star.parallax ? parallaxToDistance(star.parallax) : null,
          }),
        });
        const data = await res.json();
        if (data.bookmark) addBookmark(data.bookmark);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono transition-colors
        ${isBookmarked
          ? "bg-star-cyan/20 text-star-cyan border border-star-cyan/40"
          : "bg-white/5 text-slate-400 border border-white/10 hover:border-star-cyan/40 hover:text-star-cyan"
        }`}
    >
      {isBookmarked
        ? <><BookmarkCheck className="w-3.5 h-3.5" /> Saved</>
        : <><Bookmark      className="w-3.5 h-3.5" /> Save</>
      }
    </button>
  );
}

// ─── Main panel ───────────────────────────────────────────────────────────────

export default function StarPanel() {
  const { selectedStar, isStarPanelOpen, setSelectedStar } = useStore();
  const [spectrumData, setSpectrumData] = useState<{
    flux: number[];
    wavelengths: number[];
    source: "sdss" | "synthetic";
  } | null>(null);

  // Fetch SDSS spectrum when star changes
  useEffect(() => {
    if (!selectedStar?.ra) { setSpectrumData(null); return; }
    setSpectrumData(null);
    fetch(`/api/spectrum?ra=${selectedStar.ra}&dec=${selectedStar.dec}`)
      .then((r) => r.json())
      .then((d) => { if (d.flux) setSpectrumData(d); })
      .catch(() => {});
  }, [selectedStar]);

  const star = selectedStar;
  if (!star) return null;

  const temp = star.teff_val ?? (star.bp_rp != null ? bpRpToTemperature(star.bp_rp) : null);
  const distPc = star.parallax ? parallaxToDistance(star.parallax) : null;
  const simbadUrl = `https://simbad.u-strasbg.fr/simbad/sim-id?Ident=Gaia+DR3+${star.source_id}`;
  const vizierUrl = `https://vizier.cds.unistra.fr/viz-bin/VizieR-4?-source=I/355/gaiadr3&-c=${star.ra}+${star.dec}&-c.rs=0.01`;

  return (
    <AnimatePresence>
      {isStarPanelOpen && (
        <motion.div
          initial={{ x: "100%", opacity: 0 }}
          animate={{ x: 0,      opacity: 1 }}
          exit={{   x: "100%", opacity: 0 }}
          transition={{ type: "spring", damping: 30, stiffness: 300 }}
          className="fixed right-4 top-16 bottom-4 w-80 z-30 flex flex-col"
        >
          <div className="flex-1 overflow-y-auto rounded-xl border border-white/10 bg-space-950/90 backdrop-blur-md shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <div>
                <div className="flex items-center gap-2">
                  <Star className="w-4 h-4 text-star-gold" />
                  <h2 className="text-sm font-semibold text-star-white">Gaia DR3</h2>
                  {temp && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 font-mono text-slate-300">
                      {spectralType(temp)}-type
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 font-mono mt-0.5">{star.source_id}</p>
              </div>
              <div className="flex items-center gap-2">
                <BookmarkButton star={star} />
                <button
                  onClick={() => setSelectedStar(null)}
                  className="p-1 rounded hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="p-4 space-y-4">
              {/* Spectrum */}
              {temp && (
                <div>
                  <h3 className="text-[10px] uppercase tracking-widest text-slate-500 mb-2">Spectrum</h3>
                  <SpectrumChart
                    temperature={temp}
                    source={spectrumData?.source ?? "synthetic"}
                    sdssFlux={spectrumData?.flux}
                    sdssWavelengths={spectrumData?.wavelengths}
                  />
                </div>
              )}

              {/* Position */}
              <div>
                <h3 className="text-[10px] uppercase tracking-widest text-slate-500 mb-1">Position</h3>
                <DataRow label="RA"   value={`${star.ra.toFixed(6)}°`}  />
                <DataRow label="Dec"  value={`${star.dec.toFixed(6)}°`} />
                {star.l  != null && <DataRow label="Gal. lon." value={`${star.l.toFixed(4)}°`} />}
                {star.b  != null && <DataRow label="Gal. lat." value={`${star.b.toFixed(4)}°`} />}
                {distPc  != null && (
                  <DataRow
                    label="Distance"
                    value={formatDistance(distPc)}
                    icon={Navigation}
                  />
                )}
              </div>

              {/* Physical */}
              <div>
                <h3 className="text-[10px] uppercase tracking-widest text-slate-500 mb-1">Physical</h3>
                {temp && (
                  <DataRow
                    label="Temperature"
                    value={temp.toLocaleString()}
                    unit="K"
                    icon={Thermometer}
                  />
                )}
                {star.phot_g_mean_mag != null && (
                  <DataRow label="G magnitude" value={star.phot_g_mean_mag.toFixed(3)} icon={Gauge} />
                )}
                {star.bp_rp != null && (
                  <DataRow label="BP – RP" value={star.bp_rp.toFixed(3)} unit="mag" />
                )}
              </div>

              {/* Kinematics */}
              <div>
                <h3 className="text-[10px] uppercase tracking-widest text-slate-500 mb-1">Kinematics</h3>
                {star.pmra != null && (
                  <DataRow label="μ_RA" value={formatPM(star.pmra)} icon={Zap} />
                )}
                {star.pmdec != null && (
                  <DataRow label="μ_Dec" value={formatPM(star.pmdec)} />
                )}
                {star.radial_velocity != null && (
                  <DataRow label="Radial vel." value={`${star.radial_velocity.toFixed(2)} km/s`} />
                )}
                {star.parallax != null && (
                  <DataRow label="Parallax" value={`${star.parallax.toFixed(4)} mas`} />
                )}
              </div>

              {/* External links */}
              <div>
                <h3 className="text-[10px] uppercase tracking-widest text-slate-500 mb-2">Archives</h3>
                <div className="flex gap-2 flex-wrap">
                  {[
                    { label: "SIMBAD", url: simbadUrl },
                    { label: "VizieR",  url: vizierUrl },
                  ].map(({ label, url }) => (
                    <a
                      key={label}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-[11px] px-2.5 py-1 rounded border border-white/10
                                 text-slate-400 hover:text-star-cyan hover:border-star-cyan/40 transition-colors font-mono"
                    >
                      {label} <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
