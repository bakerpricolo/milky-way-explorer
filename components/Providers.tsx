"use client";

/**
 * Client-side providers wrapper.
 * Add any context providers here (theme, query client, etc.)
 * Currently the app uses Zustand (no provider needed) + Supabase (handles its own state).
 */
export default function Providers({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
