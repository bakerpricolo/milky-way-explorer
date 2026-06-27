import { create } from "zustand";
import type { GaiaStar, Bookmark, AppUser } from "@/types";

interface AppState {
  // ── Star data ────────────────────────────────────────
  gaiaStars: GaiaStar[];
  setGaiaStars: (stars: GaiaStar[]) => void;

  // ── Interaction ──────────────────────────────────────
  selectedStar: GaiaStar | null;
  setSelectedStar: (star: GaiaStar | null) => void;

  hoveredStarId: string | null;
  setHoveredStarId: (id: string | null) => void;

  /** Fly-to target set by search / bookmark click */
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

  // ── Galaxy loading state ─────────────────────────────
  isGaiaLoaded: boolean;
  setGaiaLoaded: (v: boolean) => void;
}

export const useStore = create<AppState>((set) => ({
  // Star data
  gaiaStars: [],
  setGaiaStars: (stars) => set({ gaiaStars: stars }),

  // Interaction
  selectedStar: null,
  setSelectedStar: (star) =>
    set({ selectedStar: star, isStarPanelOpen: star !== null }),

  hoveredStarId: null,
  setHoveredStarId: (id) => set({ hoveredStarId: id }),

  focusTarget: null,
  setFocusTarget: (target) => set({ focusTarget: target }),

  // UI panels
  isStarPanelOpen: false,
  setStarPanelOpen: (open) =>
    set({ isStarPanelOpen: open, selectedStar: open ? undefined : null }),

  isBookmarksPanelOpen: false,
  setBookmarksPanelOpen: (open) => set({ isBookmarksPanelOpen: open }),

  isAuthModalOpen: false,
  setAuthModalOpen: (open) => set({ isAuthModalOpen: open }),

  // Search
  searchQuery: "",
  setSearchQuery: (q) => set({ searchQuery: q }),
  searchResults: [],
  setSearchResults: (r) => set({ searchResults: r }),

  // Bookmarks
  bookmarks: [],
  setBookmarks: (bookmarks) => set({ bookmarks }),
  addBookmark: (bookmark) =>
    set((s) => ({ bookmarks: [...s.bookmarks, bookmark] })),
  removeBookmark: (starId) =>
    set((s) => ({ bookmarks: s.bookmarks.filter((b) => b.star_id !== starId) })),

  // User
  user: null,
  setUser: (user) => set({ user }),

  // Loading
  isGaiaLoaded: false,
  setGaiaLoaded: (v) => set({ isGaiaLoaded: v }),
}));
