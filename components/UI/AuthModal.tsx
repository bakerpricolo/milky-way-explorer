"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X, Telescope, Mail, Loader2, CheckCircle } from "lucide-react";
import { useState } from "react";
import { useStore } from "@/lib/store";
import { createClient } from "@/lib/supabase/client";

export default function AuthModal() {
  const { isAuthModalOpen, setAuthModalOpen } = useStore();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSendLink = async () => {
    if (!email) return;
    setLoading(true);
    setError("");
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: "https://milky-way-explorer-ten.vercel.app",
      },
    });
    setLoading(false);
    if (error) {
      setError(error.message);
    } else {
      setSent(true);
    }
  };

  return (
    <AnimatePresence>
      {isAuthModalOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setAuthModalOpen(false)}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
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

            <div className="flex justify-center mb-6">
              <div className="w-14 h-14 rounded-full bg-star-cyan/10 border border-star-cyan/25
                              flex items-center justify-center">
                <Telescope className="w-7 h-7 text-star-cyan" />
              </div>
            </div>

            {sent ? (
              <div className="text-center">
                <CheckCircle className="w-10 h-10 text-star-cyan mx-auto mb-3" />
                <h2 className="text-lg font-semibold text-star-white mb-2">Check your email</h2>
                <p className="text-sm text-slate-500">
                  We sent a magic link to <span className="text-star-white">{email}</span>.
                  Click it to sign in.
                </p>
              </div>
            ) : (
              <>
                <h2 className="text-center text-lg font-semibold text-star-white mb-1">
                  Save your discoveries
                </h2>
                <p className="text-center text-sm text-slate-500 mb-6">
                  Enter your email and we'll send you a sign-in link. No password needed.
                </p>

                <div className="space-y-3">
                  <div className="flex items-center gap-2 bg-white/5 border border-white/10
                                  rounded-xl px-3 py-2 focus-within:border-star-cyan/40 transition-colors">
                    <Mail className="w-4 h-4 text-slate-500 shrink-0" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleSendLink()}
                      placeholder="you@example.com"
                      className="flex-1 bg-transparent text-sm text-star-white
                                 placeholder-slate-600 outline-none font-mono"
                    />
                  </div>

                  {error && (
                    <p className="text-xs text-red-400 font-mono">{error}</p>
                  )}

                  <button
                    onClick={handleSendLink}
                    disabled={loading || !email}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl
                               bg-star-cyan/10 text-star-cyan border border-star-cyan/30
                               font-medium text-sm hover:bg-star-cyan/20 transition-colors
                               disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading
                      ? <><Loader2 className="w-4 h-4 animate-spin" /> Sending…</>
                      : "Send magic link"
                    }
                  </button>
                </div>
              </>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}