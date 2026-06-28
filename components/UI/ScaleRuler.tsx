"use client";

import { useStore } from "@/lib/store";

const LY_PER_KPC = 3261.56;

function formatDistance(ly: number): string {
  if (ly < 10)    return `${ly.toFixed(1)} ly`;
  if (ly < 1000)  return `${Math.round(ly)} ly`;
  if (ly < 10000) return `${(ly / LY_PER_KPC).toFixed(2)} kpc`;
  return `${(ly / LY_PER_KPC).toFixed(1)} kpc`;
}

export default function ScaleRuler() {
  const rulerData = useStore((s) => s.rulerData);

  if (!rulerData || rulerData.pixelWidth < 20) return null;

  const width = Math.round(rulerData.pixelWidth);

  return (
    <div
      className="fixed z-20 pointer-events-none"
      style={{ right: 20, bottom: 110 }}
    >
      <div className="flex flex-col items-center gap-1">
        {/* Label */}
        <span className="text-[10px] font-mono text-slate-400">
          {formatDistance(rulerData.lightYears)}
        </span>

        {/* Ruler bar */}
        <div className="relative flex items-center" style={{ width }}>
          {/* Main line */}
          <div className="absolute inset-x-0 top-1/2 h-px bg-slate-400/60" />
          {/* Left cap */}
          <div className="absolute left-0 w-px h-2.5 bg-slate-400/60 top-1/2 -translate-y-1/2" />
          {/* Right cap */}
          <div className="absolute right-0 w-px h-2.5 bg-slate-400/60 top-1/2 -translate-y-1/2" />
        </div>
      </div>
    </div>
  );
}
