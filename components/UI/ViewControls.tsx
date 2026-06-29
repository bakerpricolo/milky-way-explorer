"use client";

import { useStore, type ViewMode } from "@/lib/store";
import { Globe, MapPin, Sun } from "lucide-react";

const VIEWS: { mode: ViewMode; label: string; icon: React.ElementType; desc: string }[] = [
  { mode: "galaxy", label: "Galaxy",  icon: Globe,  desc: "Full Milky Way"         },
  { mode: "local",  label: "Local",   icon: MapPin, desc: "Solar neighbourhood"    },
  { mode: "solar",  label: "System",  icon: Sun,    desc: "Our solar system"       },
];

export default function ViewControls() {
  const { viewMode, setViewMode } = useStore();

  return (
    <div className="fixed top-16 right-4 z-20 mt-3">
      <div className="bg-space-950/90 backdrop-blur-md border border-white/10 rounded-xl p-1 shadow-xl flex flex-col gap-0.5">
        {VIEWS.map(({ mode, label, icon: Icon, desc }) => (
          <button
            key={mode}
            onClick={() => setViewMode(mode)}
            title={desc}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-mono transition-all
              ${viewMode === mode
                ? "bg-star-cyan/15 text-star-cyan border border-star-cyan/30"
                : "text-slate-400 hover:text-white hover:bg-white/5 border border-transparent"
              }`}
          >
            <Icon className="w-3.5 h-3.5 shrink-0" />
            <div className="text-left">
              <div>{label}</div>
              <div className="text-[9px] text-slate-600 font-normal">{desc}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
