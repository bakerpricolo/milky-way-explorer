import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        flowType: "pkce",
        storage: {
          getItem: (key: string) => {
            if (typeof document === "undefined") return null;
            const match = document.cookie.match(new RegExp(`(^| )${key}=([^;]+)`));
            return match ? decodeURIComponent(match[2]) : null;
          },
          setItem: (key: string, value: string) => {
            document.cookie = `${key}=${encodeURIComponent(value)};path=/;max-age=3600;SameSite=Lax`;
          },
          removeItem: (key: string) => {
            document.cookie = `${key}=;path=/;max-age=0`;
          },
        },
      },
    }
  );
}