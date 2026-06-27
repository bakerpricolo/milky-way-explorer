"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X, Github, Telescope } from "lucide-react";
import { useStore } from "@/lib/store";
import { createClient } from "@/lib/supabase/client";

export default function AuthModal() {
  const { isAuthModalOpen, setAuthModalOpen } = useStore();

const handleGitHubSignIn = async () => {
  const supabase = createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "github",
    options: {
      redirectTo: `https://milky-way-explorer-ten.vercel.app/auth/callback`,
    },
  });
  if (error) console.error(error);
};

  return (
    <AnimatePresence>
      {isAuthModalOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setAuthModalOpen(false)}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1,    y: 0  }}
            exit={{   opacity: 0, scale: 0.95, y: 10  }}
            transition={{ type: "spring", damping: 25, stiffness: 400 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50
                       w-full max-w-sm bg-space-900 border border-white/12 rounded-2xl
                       shadow-2xl p-8"
          >
            <button
              onClick={() => setAuthModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-500
                         hover:text-white hover:bg-white/8 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Icon */}
            <div className="flex justify-center mb-6">
              <div className="w-14 h-14 rounded-full bg-star-cyan/10 border border-star-cyan/25
                              flex items-center justify-center">
                <Telescope className="w-7 h-7 text-star-cyan" />
              </div>
            </div>

            <h2 className="text-center text-lg font-semibold text-star-white mb-1">
              Save your discoveries
            </h2>
            <p className="text-center text-sm text-slate-500 mb-8">
              Sign in to bookmark stars and sync them across all your sessions.
            </p>

            <button
              onClick={handleGitHubSignIn}
              className="w-full flex items-center justify-center gap-3 py-3 rounded-xl
                         bg-white text-gray-900 font-medium text-sm hover:bg-gray-100
                         transition-colors shadow-lg"
            >
              <Github className="w-5 h-5" />
              Continue with GitHub
            </button>

            <p className="text-center text-[11px] text-slate-600 mt-5">
              We only request your public GitHub profile.
              <br />No email required.
            </p>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
