import type { Metadata, Viewport } from "next";
import "./globals.css";
import Providers from "@/components/Providers";

export const metadata: Metadata = {
  title: "Milky Way Explorer",
  description:
    "Explore 200,000+ stars from the Gaia DR3 catalog in an interactive 3D galaxy. " +
    "Search by name, click for stellar data, and bookmark your favourites.",
  keywords: ["astronomy", "milky way", "gaia", "stars", "3d", "interactive"],
  authors: [{ name: "Milky Way Explorer" }],
  openGraph: {
    title: "Milky Way Explorer",
    description: "Interactive 3D Milky Way with real Gaia DR3 star data",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#000010",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
