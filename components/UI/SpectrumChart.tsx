"use client";

import { useMemo } from "react";

// ─── Planck blackbody ─────────────────────────────────────────────────────────

const h = 6.626e-34;  // Planck constant (J·s)
const c = 3e8;        // Speed of light (m/s)
const k = 1.381e-23;  // Boltzmann constant (J/K)

function planck(wavelengthNm: number, tempK: number): number {
  const lambda = wavelengthNm * 1e-9;
  const exponent = (h * c) / (lambda * k * tempK);
  if (exponent > 700) return 0;
  return (2 * h * c * c) / (Math.pow(lambda, 5) * (Math.exp(exponent) - 1));
}

/** Sample the Planck function across visible + near-IR range, normalised 0–1. */
function syntheticSpectrum(tempK: number) {
  const wavelengths: number[] = [];
  const flux: number[]        = [];

  for (let wl = 380; wl <= 900; wl += 4) {
    wavelengths.push(wl);
    flux.push(planck(wl, tempK));
  }

  // Normalise
  const maxFlux = Math.max(...flux);
  return {
    wavelengths,
    flux: flux.map((f) => f / maxFlux),
  };
}

// ─── Wavelength → approximate visible colour ──────────────────────────────────

function wavelengthToHex(wl: number): string {
  if (wl < 380) return "#8B00FF";
  if (wl < 450) return "#4400FF";
  if (wl < 490) return "#0044FF";
  if (wl < 530) return "#00BB44";
  if (wl < 580) return "#FFEE00";
  if (wl < 640) return "#FF8800";
  if (wl < 700) return "#FF2200";
  return "#880000";
}

// ─── Known stellar absorption lines ──────────────────────────────────────────

const ABSORPTION_LINES = [
  { wl: 393, label: "Ca K" },
  { wl: 397, label: "Ca H" },
  { wl: 486, label: "Hβ"   },
  { wl: 518, label: "Mg"   },
  { wl: 589, label: "Na D" },
  { wl: 656, label: "Hα"   },
  { wl: 820, label: "Ca IR"},
];

// ─── Component ────────────────────────────────────────────────────────────────

interface SpectrumChartProps {
  temperature: number;   // K
  source?: "sdss" | "synthetic";
  sdssFlux?: number[];
  sdssWavelengths?: number[];
}

export default function SpectrumChart({
  temperature,
  source = "synthetic",
  sdssFlux,
  sdssWavelengths,
}: SpectrumChartProps) {
  const { wavelengths, flux } = useMemo(() => {
    if (source === "sdss" && sdssFlux && sdssWavelengths) {
      const maxF = Math.max(...sdssFlux);
      return {
        wavelengths: sdssWavelengths,
        flux: sdssFlux.map((f) => f / maxF),
      };
    }
    return syntheticSpectrum(temperature);
  }, [temperature, source, sdssFlux, sdssWavelengths]);

  // Build SVG path
  const W = 440, H = 120;
  const wlMin = wavelengths[0], wlMax = wavelengths[wavelengths.length - 1];

  const toX = (wl: number) => ((wl - wlMin) / (wlMax - wlMin)) * W;
  const toY = (f: number)   => H - f * (H - 4) - 2;

  const pathD = wavelengths
    .map((wl, i) => `${i === 0 ? "M" : "L"}${toX(wl).toFixed(1)},${toY(flux[i]).toFixed(1)}`)
    .join(" ");

  // Gradient stops from wavelength colours
  const gradStops = wavelengths
    .filter((_, i) => i % 5 === 0)
    .map((wl) => (
      <stop
        key={wl}
        offset={`${(((wl - wlMin) / (wlMax - wlMin)) * 100).toFixed(1)}%`}
        stopColor={wavelengthToHex(wl)}
      />
    ));

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] text-slate-500 font-mono uppercase tracking-widest">
          {source === "sdss" ? "SDSS Spectrum" : "Synthetic Blackbody"}
        </span>
        <span className="text-[10px] text-star-cyan font-mono">T = {temperature.toLocaleString()} K</span>
      </div>

      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full rounded overflow-visible"
        style={{ height: 90 }}
      >
        <defs>
          <linearGradient id="specGrad" x1="0" x2="1" y1="0" y2="0">
            {gradStops}
          </linearGradient>
          <clipPath id="specClip">
            <path d={`${pathD} L${W},${H} L0,${H} Z`} />
          </clipPath>
        </defs>

        {/* Coloured fill under curve */}
        <rect
          x={0} y={0} width={W} height={H}
          fill="url(#specGrad)"
          clipPath="url(#specClip)"
          opacity={0.25}
        />

        {/* Absorption line markers */}
        {ABSORPTION_LINES.map(({ wl, label }) => {
          if (wl < wlMin || wl > wlMax) return null;
          const x = toX(wl);
          return (
            <g key={wl}>
              <line x1={x} y1={0} x2={x} y2={H} stroke="#ffffff18" strokeWidth={1} strokeDasharray="2,2" />
              <text x={x} y={H - 2} textAnchor="middle" fontSize={7} fill="#ffffff44">{label}</text>
            </g>
          );
        })}

        {/* Spectrum curve */}
        <path
          d={pathD}
          fill="none"
          stroke="url(#specGrad)"
          strokeWidth={1.5}
          strokeLinejoin="round"
        />
      </svg>

      <div className="flex justify-between text-[9px] text-slate-600 font-mono mt-0.5">
        <span>{wlMin} nm</span>
        <span>← wavelength →</span>
        <span>{wlMax} nm</span>
      </div>
    </div>
  );
}
