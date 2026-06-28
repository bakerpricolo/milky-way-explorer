"use client";

import { useStore } from "@/lib/store";

const SPECTRAL_TYPES = [
  { type: "O", label: "O",  temp: "> 30,000 K",  color: "#9bb0ff", desc: "Blue"        },
  { type: "B", label: "B",  temp: "10–30,000 K",  color: "#aabfff", desc: "Blue-white"  },
  { type: "A", label: "A",  temp: "7.5–10,000 K", color: "#cad7ff", desc: "White"       },
  { type: "F", label: "F",  temp: "6–7,500 K",    color: "#f8f7ff", desc: "White-yellow"},
  { type: "G", label: "G",  temp: "5.2–6,000 K",  color: "#fff4d6", desc: "Yellow ☀︎"  },
  { type: "K", label: "K",  temp: "3.7–5,200 K",  color: "#ffd2a1", desc: "Orange"     },
  { type: "M", label: "M",  temp: "< 3,700 K",    color: "#ffaa88", desc: "Red"         },
];

export function getSpectralClass(teff: number | null, bpRp: number | null): string {
  const temp = teff ?? (bpRp != null ? Math.round(4600 * (1 / (0.92 * bpRp + 1.7) + 1 / (0.92 * bpRp + 0.62))) : null);
  if (!temp) return "?";
  if (temp >= 30000) return "O";
  if (temp >= 10000) return "B";
  if (temp >= 7500)  return "A";
  if (temp >= 6000)  return "F";
  if (temp >= 5200)  return "G";
  if (temp >= 3700)  return "K";
  return "M";
}

export default function FilterPanel() {
  const { spectralFilter, toggleSpectralType, setAllSpectralTypes, gaiaStars } = useStore();

  // Count stars per type
  const counts: Record<string, number> = {};
  gaiaStars.forEach((s) => {
    const t = getSpectralClass(s.teff_val, s.bp_rp);
    counts[t] = (counts[t] ?? 0) + 1;
  });

  const allOn  = Object.values(spectralFilter).every(Boolean);
  const allOff = Object.values(spectralFilter).every((v) => !v);

  return (
    <div className="fixed left-4 bottom-6 z-20">
      <div className="bg-space-950/90 backdrop-blur-md border border-white/10 rounded-2xl px-4 py-3 shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between mb-2.5">
          <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">
            Spectral Type
          </span>
          <div className="flex gap-1.5 ml-4">
            <button
              onClick={() => setAllSpectralTypes(true)}
              disabled={allOn}
              className="text-[9px] font-mono text-slate-500 hover:text-white disabled:opacity-30 transition-colors"
            >
              All
            </button>
            <span className="text-slate-700 text-[9px]">·</span>
            <button
              onClick={() => setAllSpectralTypes(false)}
              disabled={allOff}
              className="text-[9px] font-mono text-slate-500 hover:text-white disabled:opacity-30 transition-colors"
            >
              None
            </button>
          </div>
        </div>

        {/* Type buttons */}
        <div className="flex flex-col gap-1">
          {SPECTRAL_TYPES.map(({ type, label, temp, color, desc }) => {
            const active = spectralFilter[type] ?? true;
            const count  = counts[type] ?? 0;
            return (
              <button
                key={type}
                onClick={() => toggleSpectralType(type)}
                className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg transition-all text-left
                  ${active
                    ? "bg-white/5 border border-white/10"
                    : "bg-transparent border border-transparent opacity-40"
                  }`}
              >
                {/* Colour swatch */}
                <div
                  className="w-3 h-3 rounded-full shrink-0 ring-1 ring-white/20"
                  style={{ background: active ? color : "#444" }}
                />
                {/* Label */}
                <span className="font-mono text-xs text-star-white w-3">{label}</span>
                {/* Description */}
                <span className="text-[10px] text-slate-500 flex-1">{desc}</span>
                {/* Temperature */}
                <span className="text-[9px] font-mono text-slate-600 hidden sm:inline">{temp}</span>
                {/* Count */}
                {count > 0 && (
                  <span className="text-[9px] font-mono text-slate-600 w-6 text-right">{count}</span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
