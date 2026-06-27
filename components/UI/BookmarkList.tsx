"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Bookmark, Trash2, Star, MapPin } from "lucide-react";
import { useStore } from "@/lib/store";
import { formatDistance } from "@/lib/coordinates";
import type { Bookmark as BookmarkType } from "@/types";

function BookmarkCard({ bookmark }: { bookmark: BookmarkType }) {
  const { removeBookmark, setSelectedStar, gaiaStars, setAuthModalOpen } = useStore();

  const handleClick = async () => {
    // Try to find in loaded Gaia data first
    const local = gaiaStars.find((s) => s.source_id === bookmark.star_id);
    if (local) {
      setSelectedStar(local);
      return;
    }
    // Otherwise fetch by ID
    const res = await fetch(`/api/gaia?id=${bookmark.star_id}`);
    const data = await res.json();
    if (data.star) setSelectedStar(data.star);
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await fetch(`/api/bookmarks?star_id=${bookmark.star_id}`, { method: "DELETE" });
    removeBookmark(bookmark.star_id);
  };

  return (
    <div
      onClick={handleClick}
      className="group relative flex flex-col gap-1 p-3 rounded-lg border border-white/8
                 bg-white/3 hover:bg-white/6 hover:border-star-cyan/25 cursor-pointer transition-colors"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <Star className="w-3 h-3 text-star-gold shrink-0" />
          <span className="text-xs font-mono text-star-white truncate">
            {bookmark.star_name ?? `Gaia ${bookmark.star_id.slice(0, 8)}…`}
          </span>
        </div>
        <button
          onClick={handleDelete}
          className="opacity-0 group-hover:opacity-100 p-0.5 text-slate-600
                     hover:text-red-400 transition-all shrink-0"
        >
          <Trash2 className="w-3 h-3" />
        </button>
      </div>

      <div className="flex items-center gap-3 text-[10px] font-mono text-slate-500">
        {bookmark.ra != null && (
          <span className="flex items-center gap-1">
            <MapPin className="w-2.5 h-2.5" />
            {bookmark.ra.toFixed(3)}°, {bookmark.dec?.toFixed(3)}°
          </span>
        )}
        {bookmark.distance_pc != null && (
          <span>{formatDistance(bookmark.distance_pc)}</span>
        )}
      </div>

      {bookmark.temperature != null && (
        <div className="text-[10px] font-mono text-slate-600">
          T = {bookmark.temperature.toLocaleString()} K
        </div>
      )}

      {bookmark.notes && (
        <p className="text-[10px] text-slate-500 italic mt-0.5 line-clamp-2">{bookmark.notes}</p>
      )}

      <div className="text-[9px] text-slate-700 font-mono mt-0.5">
        {new Date(bookmark.created_at).toLocaleDateString()}
      </div>
    </div>
  );
}

export default function BookmarkList() {
  const { isBookmarksPanelOpen, bookmarks, user, setAuthModalOpen } = useStore();

  return (
    <AnimatePresence>
      {isBookmarksPanelOpen && (
        <motion.div
          initial={{ x: "-100%", opacity: 0 }}
          animate={{ x: 0,       opacity: 1 }}
          exit={{   x: "-100%", opacity: 0 }}
          transition={{ type: "spring", damping: 30, stiffness: 300 }}
          className="fixed left-4 top-16 bottom-4 w-72 z-30 flex flex-col"
        >
          <div className="flex-1 overflow-y-auto rounded-xl border border-white/10
                          bg-space-950/90 backdrop-blur-md shadow-2xl flex flex-col">
            {/* Header */}
            <div className="flex items-center gap-2 p-4 border-b border-white/10 shrink-0">
              <Bookmark className="w-4 h-4 text-star-cyan" />
              <h2 className="text-sm font-semibold text-star-white">Saved Stars</h2>
              {bookmarks.length > 0 && (
                <span className="ml-auto text-[10px] font-mono text-slate-500">
                  {bookmarks.length}
                </span>
              )}
            </div>

            <div className="flex-1 overflow-y-auto p-3">
              {!user ? (
                <div className="flex flex-col items-center justify-center h-full gap-3 py-8 text-center">
                  <Bookmark className="w-8 h-8 text-slate-700" />
                  <p className="text-sm text-slate-500">Sign in to save and sync stars across sessions.</p>
                  <button
                    onClick={() => useStore.getState().setAuthModalOpen(true)}
                    className="px-4 py-2 rounded-lg bg-star-cyan/10 text-star-cyan border
                               border-star-cyan/30 text-xs font-mono hover:bg-star-cyan/20 transition-colors"
                  >
                    Sign in with GitHub
                  </button>
                </div>
              ) : bookmarks.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full gap-2 py-8 text-center">
                  <Star className="w-8 h-8 text-slate-700" />
                  <p className="text-sm text-slate-500">No bookmarks yet.</p>
                  <p className="text-xs text-slate-600">Click a star, then hit Save.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {bookmarks.map((b) => (
                    <BookmarkCard key={b.id} bookmark={b} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
