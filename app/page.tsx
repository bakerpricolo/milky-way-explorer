import dynamic from "next/dynamic";
import Navbar       from "@/components/UI/Navbar";
import SearchBar    from "@/components/UI/SearchBar";
import StarPanel    from "@/components/UI/StarPanel";
import BookmarkList from "@/components/UI/BookmarkList";
import AuthModal    from "@/components/UI/AuthModal";
import TimeControls from "@/components/UI/TimeControls";
import FilterPanel  from "@/components/UI/FilterPanel";
import ScaleRuler   from "@/components/UI/ScaleRuler";
import ViewControls from "@/components/UI/ViewControls";
import PlanetPanel  from "@/components/UI/PlanetPanel";

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
      <GalaxyCanvas />
      <Navbar />
      <SearchBar />
      <StarPanel />
      <PlanetPanel />
      <BookmarkList />
      <AuthModal />
      <TimeControls />
      <FilterPanel />
      <ScaleRuler />
      <ViewControls />
    </main>
  );
}
