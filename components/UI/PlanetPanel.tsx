"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Globe, Thermometer, Clock, Moon } from "lucide-react";
import { useStore } from "@/lib/store";

function Row({ label, value, icon: Icon }: { label: string; value: string; icon?: React.ElementType }) {
  return (
    <div className="flex items-center justify-between gap-2 py-1.5 border-b border-white/5">
      <div className="flex items-center gap-1.5 text-slate-400 text-xs shrink-0">
        {Icon && <Icon className="w-3 h-3" />}
        <span>{label}</span>
      </div>
      <span className="text-right font-mono text-xs text-star-white">{value}</span>
    </div>
  );
}

const TYPE_LABELS = {
  "rocky": "Terrestrial",
  "gas-giant": "Gas Giant",
  "ice-giant": "Ice Giant",
};

export default function PlanetPanel() {
  const { selectedPlanet, setSelectedPlanet } = useStore();

  return (
    <AnimatePresence>
      {selectedPlanet && (
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
              <div className="flex items-center gap-3">
                <div
                  className="w-6 h-6 rounded-full"
                  style={{ background: selectedPlanet.color, boxShadow: `0 0 12px ${selectedPlanet.color}66` }}
                />
                <div>
                  <h2 className="text-sm font-semibold text-star-white">{selectedPlanet.name}</h2>
                  <p className="text-[11px] text-slate-500 font-mono">{TYPE_LABELS[selectedPlanet.type]}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedPlanet(null)}
                className="p-1 rounded hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              {/* Description */}
              <p className="text-xs text-slate-400 leading-relaxed">{selectedPlanet.description}</p>

              {/* Key stats */}
              <div>
                <h3 className="text-[10px] uppercase tracking-widest text-slate-500 mb-1">Physical</h3>
                <Row label="Diameter"     value={`${selectedPlanet.diameter_km.toLocaleString()} km`} icon={Globe} />
                <Row label="Mass"         value={`${selectedPlanet.mass_earth} × Earth`} />
                <Row label="Moons"        value={String(selectedPlanet.moons)} icon={Moon} />
                <Row label="Axial tilt"   value={`${selectedPlanet.tiltDeg}°`} />
              </div>

              <div>
                <h3 className="text-[10px] uppercase tracking-widest text-slate-500 mb-1">Orbit & Rotation</h3>
                <Row label="Distance (avg)" value={`${selectedPlanet.orbitRadius} AU`} />
                <Row label="Year length"    value={`${selectedPlanet.periodDays.toLocaleString()} days`} />
                <Row label="Day length"     value={selectedPlanet.dayLength} icon={Clock} />
              </div>

              <div>
                <h3 className="text-[10px] uppercase tracking-widest text-slate-500 mb-1">Conditions</h3>
                <Row label="Temperature"  value={selectedPlanet.surfaceTemp} icon={Thermometer} />
                {selectedPlanet.hasRings && <Row label="Ring system" value="Yes" />}
              </div>

              {/* Solar system position hint */}
              <div className="text-[10px] text-slate-600 font-mono text-center pt-2">
                {selectedPlanet.orbitRadius} AU from the Sun
                {" · "}{(selectedPlanet.orbitRadius * 149597870.7).toLocaleString(undefined, { maximumFractionDigits: 0 })} km
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
