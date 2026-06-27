"use client";

import { Telescope, Bookmark, LogIn, LogOut, User, Loader2 } from "lucide-react";
import { useStore } from "@/lib/store";
import { createClient } from "@/lib/supabase/client";
import { useEffect } from "react";

export default function Navbar() {
  const {
    user, setUser,
    gaiaStars, isGaiaLoaded,
    isBookmarksPanelOpen, setBookmarksPanelOpen,
    setAuthModalOpen,
  } = useStore();

  // Sync Supabase session into store
  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setUser({
          id: data.user.id,
          email: data.user.email ?? null,
          avatar_url: data.user.user_metadata?.avatar_url ?? null,
          user_metadata: data.user.user_metadata,
        });
      }
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email ?? null,
          avatar_url: session.user.user_metadata?.avatar_url ?? null,
          user_metadata: session.user.user_metadata,
        });
        // Load bookmarks on sign-in
        fetch("/api/bookmarks")
          .then((r) => r.json())
          .then((d) => { if (d.bookmarks) useStore.getState().setBookmarks(d.bookmarks); })
          .catch(console.error);
      } else {
        setUser(null);
        useStore.getState().setBookmarks([]);
      }
    });

    return () => listener.subscription.unsubscribe();
  }, [setUser]);

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-40 h-14 flex items-center justify-between px-5
                    border-b border-white/8 bg-space-950/70 backdrop-blur-lg">
      {/* Brand */}
      <div className="flex items-center gap-2.5">
        <Telescope className="w-5 h-5 text-star-cyan" />
        <span className="font-semibold text-star-white tracking-tight">Milky Way Explorer</span>
        <span className="hidden sm:inline text-[10px] font-mono text-slate-600 border border-white/10
                         px-1.5 py-0.5 rounded ml-1">
          Gaia DR3
        </span>
      </div>

      {/* Star counter */}
      <div className="hidden md:flex items-center gap-1.5 text-xs font-mono text-slate-500">
        {isGaiaLoaded ? (
          <>
            <span className="w-1.5 h-1.5 rounded-full bg-star-cyan animate-pulse-slow inline-block" />
            <span>
              <span className="text-star-cyan">{gaiaStars.length.toLocaleString()}</span>
              {" "}real stars loaded
            </span>
            <span className="mx-2 text-slate-700">·</span>
            <span>
              <span className="text-slate-400">200,000</span> procedural
            </span>
          </>
        ) : (
          <>
            <Loader2 className="w-3 h-3 animate-spin text-slate-600" />
            <span>Loading Gaia catalog…</span>
          </>
        )}
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-2">
        {/* Bookmarks */}
        <button
          onClick={() => setBookmarksPanelOpen(!isBookmarksPanelOpen)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono transition-colors
            ${isBookmarksPanelOpen
              ? "bg-star-cyan/15 text-star-cyan border border-star-cyan/30"
              : "text-slate-400 border border-white/10 hover:border-white/20 hover:text-white"
            }`}
        >
          <Bookmark className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Bookmarks</span>
        </button>

        {/* Auth */}
        {user ? (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-2 py-1.5 rounded border border-white/10">
              {user.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={user.avatar_url} alt="avatar" className="w-5 h-5 rounded-full" />
              ) : (
                <User className="w-3.5 h-3.5 text-slate-400" />
              )}
              <span className="hidden sm:inline text-xs text-slate-400 font-mono max-w-[120px] truncate">
                {user.email ?? "signed in"}
              </span>
            </div>
            <button
              onClick={handleSignOut}
              className="p-1.5 rounded border border-white/10 text-slate-400
                         hover:text-red-400 hover:border-red-400/30 transition-colors"
              title="Sign out"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => setAuthModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono
                       bg-star-cyan/10 text-star-cyan border border-star-cyan/30
                       hover:bg-star-cyan/20 transition-colors"
          >
            <LogIn className="w-3.5 h-3.5" />
            Sign in
          </button>
        )}
      </div>
    </nav>
  );
}
