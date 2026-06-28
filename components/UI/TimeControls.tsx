"use client";

import { useEffect, useRef, useState } from "react";
import { Play, Pause, RotateCcw, Clock } from "lucide-react";
import { useStore } from "@/lib/store";

const MIN_YEAR   = -100_000;
const MAX_YEAR   =  100_000;
const PLAY_SPEED =  800;   // years per frame at 60fps

function formatYear(offset: number): string {
  const year = 2024 + offset;
  if (offset === 0) return "Present day (2024 AD)";
  if (year > 0)     return `${year.toLocaleString()} AD`;
  return `${Math.abs(year).toLocaleString()} BC`;
}

function formatOffset(offset: number): string {
  if (offset === 0) return "";
  const abs = Math.abs(offset);
  const sign = offset > 0 ? "+" : "−";
  if (abs >= 1000) return `${sign}${(abs / 1000).toFixed(0)}k yrs`;
  return `${sign}${abs.toLocaleString()} yrs`;
}

export default function TimeControls() {
  const { timeOffset, setTimeOffset } = useStore();
  const [isPlaying, setIsPlaying] = useState(false);
  const [direction, setDirection] = useState<1 | -1>(1);
  const rafRef = useRef<number | null>(null);

  // Animation loop
  useEffect(() => {
    if (!isPlaying) {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      return;
    }

    const step = () => {
      setTimeOffset((prev: number) => {
        const next = prev + PLAY_SPEED * direction;
        if (next >= MAX_YEAR || next <= MIN_YEAR) {
          setIsPlaying(false);
          return Math.max(MIN_YEAR, Math.min(MAX_YEAR, next));
        }
        return next;
      });
      rafRef.current = requestAnimationFrame(step);
    };

    rafRef.current = requestAnimationFrame(step);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [isPlaying, direction, setTimeOffset]);

  const handleReset = () => {
    setIsPlaying(false);
    setTimeOffset(0);
  };

  const progress = (timeOffset - MIN_YEAR) / (MAX_YEAR - MIN_YEAR);

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-20 w-full max-w-xl px-4">
      <div className="bg-space-950/90 backdrop-blur-md border border-white/10 rounded-2xl
                      px-5 py-4 shadow-2xl">

        {/* Header row */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-star-cyan" />
            <span className="text-xs font-mono text-star-cyan">Stellar Motion</span>
          </div>
          <div className="text-center">
            <span className="text-xs font-mono text-star-white">{formatYear(timeOffset)}</span>
            {timeOffset !== 0 && (
              <span className="ml-2 text-[10px] font-mono text-slate-500">
                {formatOffset(timeOffset)}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            {/* Direction toggle */}
            <button
              onClick={() => setDirection(direction === 1 ? -1 : 1)}
              className="text-[10px] font-mono px-2 py-1 rounded border border-white/10
                         text-slate-400 hover:text-white hover:border-white/20 transition-colors"
            >
              {direction === 1 ? "→ Future" : "← Past"}
            </button>

            {/* Reset */}
            <button
              onClick={handleReset}
              className="p-1.5 rounded border border-white/10 text-slate-400
                         hover:text-white hover:border-white/20 transition-colors"
              title="Reset to present"
            >
              <RotateCcw className="w-3 h-3" />
            </button>

            {/* Play / Pause */}
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono
                          transition-colors border
                          ${isPlaying
                            ? "bg-star-cyan/20 text-star-cyan border-star-cyan/40"
                            : "bg-white/5 text-slate-300 border-white/10 hover:border-white/20"
                          }`}
            >
              {isPlaying
                ? <><Pause className="w-3 h-3" /> Pause</>
                : <><Play  className="w-3 h-3" /> Play</>
              }
            </button>
          </div>
        </div>

        {/* Slider */}
        <div className="relative">
          {/* Track */}
          <div className="h-1 bg-white/10 rounded-full relative">
            {/* Progress fill */}
            <div
              className="absolute h-full bg-gradient-to-r from-star-blue via-star-cyan to-star-gold
                         rounded-full transition-none"
              style={{ width: `${progress * 100}%` }}
            />
            {/* Centre marker (present day) */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
                            w-0.5 h-3 bg-white/30 rounded-full" />
          </div>

          {/* Range input overlay */}
          <input
            type="range"
            min={MIN_YEAR}
            max={MAX_YEAR}
            step={500}
            value={timeOffset}
            onChange={(e) => {
              setIsPlaying(false);
              setTimeOffset(Number(e.target.value));
            }}
            className="absolute inset-0 w-full opacity-0 cursor-pointer h-5 -top-2"
          />
        </div>

        {/* Labels */}
        <div className="flex justify-between mt-1.5 text-[9px] font-mono text-slate-600">
          <span>100,000 BC</span>
          <span>Present</span>
          <span>100,000 AD</span>
        </div>
      </div>
    </div>
  );
}
