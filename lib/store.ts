import { create } from "zustand";
import type { GaiaStar, Bookmark, AppUser } from "@/types";

interface RulerData {
  pixelWidth: number;
  lightYears: number;
}

interface AppState {
  // ── Star data ────────────────────────────────────────
  gaiaStars: GaiaStar[];
  setGaiaStars: (stars: GaiaStar[]) => void;

  // ── Interaction ──────────────────────────────────────
  selectedStar: GaiaStar | null;
  setSelectedStar: (star: GaiaStar | null) => void;

  hoveredStarId: string | null;
  setHoveredStarId: (id: string | null) => void;

  focusTarget: { ra: number; dec: number } | null;
  setFocusTarget: (target: { ra: number; dec: number } | null) => void;

  // ── UI panels ────────────────────────────────────────
  isStarPanelOpen: boolean;
  setStarPanelOpen: (open: boolean) => void;

  isBookmarksPanelOpen: boolean;
  setBookmarksPanelOpen: (open: boolean) => void;

  isAuthModalOpen: boolean;
  setAuthModalOpen: (open: boolean) => void;

  // ── Search ───────────────────────────────────────────
  searchQuery: string;
  setSearchQuery: (q: string) => void;

  searchResults: Array<{ name: string; ra: number; dec: number }>;
  setSearchResults: (r: Array<{ name: string; ra: number; dec: number }>) => void;

  // ── Bookmarks ────────────────────────────────────────
  bookmarks: Bookmark[];
  setBookmarks: (bookmarks: Bookmark[]) => void;
  addBookmark: (bookmark: Bookmark) => void;
  removeBookmark: (starId: string) => void;

  // ── User ─────────────────────────────────────────────
  user: AppUser | null;
  setUser: (user: AppUser | null) => void;

  // ── Galaxy loading ────────────────────────────────────
  isGaiaLoaded: boolean;
  setGaiaLoaded: (v: boolean) => void;

  // ── Time controls ─────────────────────────────────────
  timeOffset: number;
  setTimeOffset: (years: number) => void;

  // ── Spectral filters ──────────────────────────────────
  spectralFilter: Record<string, boolean>;
  toggleSpectralType: (type: string) => void;
  setAllSpectralTypes: (visible: boolean) => void;

  // ── Scale ruler ───────────────────────────────────────
  rulerData: RulerData | null;
  setRulerData: (data: RulerData | null) => void;
}

const ALL_TYPES = { O: true, B: true, A: true, F: true, G: true, K: true, M: true };

export const useStore = create<AppState>((set) => ({
  gaiaStars: [],
  setGaiaStars: (stars) => set({ gaiaStars: stars }),

  selectedStar: null,
  setSelectedStar: (star) => set({ selectedStar: star, isStarPanelOpen: star !== null }),

  hoveredStarId: null,
  setHoveredStarId: (id) => set({ hoveredStarId: id }),

  focusTarget: null,
  setFocusTarget: (target) => set({ focusTarget: target }),

  isStarPanelOpen: false,
  setStarPanelOpen: (open) => set({ isStarPanelOpen: open, selectedStar: open ? undefined : null }),

  isBookmarksPanelOpen: false,
  setBookmarksPanelOpen: (open) => set({ isBookmarksPanelOpen: open }),

  isAuthModalOpen: false,
  setAuthModalOpen: (open) => set({ isAuthModalOpen: open }),

  searchQuery: "",
  setSearchQuery: (q) => set({ searchQuery: q }),
  searchResults: [],
  setSearchResults: (r) => set({ searchResults: r }),

  bookmarks: [],
  setBookmarks: (bookmarks) => set({ bookmarks }),
  addBookmark: (bookmark) => set((s) => ({ bookmarks: [...s.bookmarks, bookmark] })),
  removeBookmark: (starId) => set((s) => ({ bookmarks: s.bookmarks.filter((b) => b.star_id !== starId) })),

  user: null,
  setUser: (user) => set({ user }),

  isGaiaLoaded: false,
  setGaiaLoaded: (v) => set({ isGaiaLoaded: v }),

  timeOffset: 0,
  setTimeOffset: (years) => set({ timeOffset: years }),

  spectralFilter: { ...ALL_TYPES },
  toggleSpectralType: (type) =>
    set((s) => ({
      spectralFilter: { ...s.spectralFilter, [type]: !s.spectralFilter[type] },
    })),
  setAllSpectralTypes: (visible) =>
    set({ spectralFilter: Object.fromEntries(Object.keys(ALL_TYPES).map((k) => [k, visible])) }),

  rulerData: null,
  setRulerData: (data) => set({ rulerData: data }),
}));
