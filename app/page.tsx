import dynamic from "next/dynamic";
import Navbar        from "@/components/UI/Navbar";
import SearchBar     from "@/components/UI/SearchBar";
import StarPanel     from "@/components/UI/StarPanel";
import BookmarkList  from "@/components/UI/BookmarkList";
import AuthModal     from "@/components/UI/AuthModal";
import TimeControls  from "@/components/UI/TimeControls";

/**
 * The galaxy canvas uses Three.js / WebGL, which only runs in the browser.
 * Dynamic import with ssr:false prevents Next.js from attempting server-side rendering.
 */
const GalaxyCanvas = dynamic(() => import("@/components/Galaxy"), {
  ssr: false,
  loading: () => (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-[#000010] gap-4">
      <div className="w-20 h-20 rounded-full border-2 border-star-cyan/30 border-t-star-cyan animate-spin" />
      <p className="text-sm text-slate-500 font-mono tracking-widest animate-pulse">
        INITIALISING GALAXY…
      </p>
    </div>
  ),
});

export default function Home() {
  return (
    <main className="fixed inset-0 overflow-hidden">
      {/* Full-screen 3D galaxy */}
      <GalaxyCanvas />

      {/* ── Overlaid UI ──────────────────────────────────────── */}

      {/* Top navigation bar */}
      <Navbar />

      {/* Centred search bar (below navbar) */}
      <SearchBar />

      {/* Right: Star detail panel */}
      <StarPanel />

      {/* Left: Bookmarks sidebar */}
      <BookmarkList />

      {/* Auth modal (portal-style, centred) */}
      <AuthModal />

      {/* Bottom: time controls */}
      <TimeControls />
    </main>
  );
}
