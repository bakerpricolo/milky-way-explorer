"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Search, X, Loader2, Star } from "lucide-react";
import { useStore } from "@/lib/store";

interface SearchResult {
  name: string;
  ra: number;
  dec: number;
}

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

export default function SearchBar() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debouncedQuery = useDebounce(query, 400);

  const { setFocusTarget, setSelectedStar, gaiaStars } = useStore();

  // Search when debounced query changes
  useEffect(() => {
    if (!debouncedQuery.trim() || debouncedQuery.length < 2) {
      setResults([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    fetch(`/api/gaia?search=${encodeURIComponent(debouncedQuery)}`)
      .then((r) => r.json())
      .then((data) => {
        setResults(data.results ?? []);
        setIsOpen(true);
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, [debouncedQuery]);

  // Keyboard shortcut: "/" to focus search
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "/" && document.activeElement?.tagName !== "INPUT") {
        e.preventDefault();
        inputRef.current?.focus();
      }
      if (e.key === "Escape") {
        setIsOpen(false);
        inputRef.current?.blur();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const handleSelect = useCallback(
    async (result: SearchResult) => {
      setIsOpen(false);
      setQuery(result.name);

      // Check if we have this star in local Gaia data first
      const localMatch = gaiaStars.find((s) => {
        const dRA  = Math.abs(s.ra  - result.ra);
        const dDec = Math.abs(s.dec - result.dec);
        return dRA < 0.05 && dDec < 0.05;
      });

      if (localMatch) {
        setSelectedStar(localMatch);
      } else {
        // Fetch from Gaia by position
        const res = await fetch(
          `/api/gaia?ra=${result.ra}&dec=${result.dec}&radius=0.05`
        );
        const data = await res.json();
        if (data.star) setSelectedStar(data.star);
      }

      setFocusTarget({ ra: result.ra, dec: result.dec });
    },
    [gaiaStars, setSelectedStar, setFocusTarget]
  );

  const clear = () => {
    setQuery("");
    setResults([]);
    setIsOpen(false);
    inputRef.current?.focus();
  };

  return (
    <div className="fixed top-16 left-1/2 -translate-x-1/2 z-30 w-full max-w-sm px-4 pt-3">
      <div className="relative">
        {/* Input */}
        <div className="flex items-center gap-2 bg-space-900/90 backdrop-blur-md border border-white/12
                        rounded-xl px-3 py-2 shadow-xl focus-within:border-star-cyan/40 transition-colors">
          {isLoading
            ? <Loader2 className="w-4 h-4 text-slate-500 shrink-0 animate-spin" />
            : <Search   className="w-4 h-4 text-slate-500 shrink-0" />
          }
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => results.length > 0 && setIsOpen(true)}
            placeholder='Search stars… (press "/")'
            className="flex-1 bg-transparent text-sm text-star-white placeholder-slate-600
                       outline-none font-mono"
          />
          {query && (
            <button onClick={clear} className="text-slate-500 hover:text-white transition-colors">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <kbd className="hidden sm:inline text-[9px] text-slate-600 border border-white/10
                          rounded px-1 py-0.5 font-mono">/</kbd>
        </div>

        {/* Dropdown results */}
        {isOpen && results.length > 0 && (
          <div className="absolute top-full mt-1.5 left-0 right-0 bg-space-900/95 backdrop-blur-md
                          border border-white/10 rounded-xl shadow-2xl overflow-hidden">
            {results.map((result, i) => (
              <button
                key={i}
                onClick={() => handleSelect(result)}
                className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-white/5
                           text-left transition-colors border-b border-white/5 last:border-0"
              >
                <Star className="w-3.5 h-3.5 text-star-gold shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-star-white font-mono truncate">{result.name}</div>
                  <div className="text-[10px] text-slate-500 font-mono">
                    RA {result.ra.toFixed(4)}°  Dec {result.dec.toFixed(4)}°
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}

        {isOpen && query.length >= 2 && !isLoading && results.length === 0 && (
          <div className="absolute top-full mt-1.5 left-0 right-0 bg-space-900/95 backdrop-blur-md
                          border border-white/10 rounded-xl px-4 py-3 text-xs text-slate-500 font-mono">
            No stars found for &ldquo;{query}&rdquo;
          </div>
        )}
      </div>
    </div>
  );
}
