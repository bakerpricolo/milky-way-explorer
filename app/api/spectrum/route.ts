import { NextRequest, NextResponse } from "next/server";

const SDSS_SPECTRUM_URL = "https://skyserver.sdss.org/dr18/SkyServerWS/SpectroQuery/GetSpectrum";

/**
 * GET /api/spectrum?ra=<deg>&dec=<deg>
 *
 * Attempts to retrieve a real SDSS spectrum for the given coordinates.
 * If SDSS has no observation, returns a synthetic blackbody flag
 * so the client renders an approximated spectrum instead.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const ra  = searchParams.get("ra");
  const dec = searchParams.get("dec");

  if (!ra || !dec) {
    return NextResponse.json({ error: "ra and dec are required" }, { status: 400 });
  }

  try {
    // Query SDSS SkyServer for a spectrum within 0.02° of the star
    const params = new URLSearchParams({
      ra:     ra,
      dec:    dec,
      radius: "0.02",
      format: "json",
    });

    const res = await fetch(`${SDSS_SPECTRUM_URL}?${params}`, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(5_000), // 5 s timeout
    });

    if (!res.ok) {
      // SDSS has no data for this position — client will use synthetic
      return NextResponse.json({ source: "synthetic" });
    }

    const raw = await res.json() as {
      Rows?: Array<{ Wavelength: number; BestFit?: number; Flux?: number }>;
    };

    if (!raw.Rows || raw.Rows.length === 0) {
      return NextResponse.json({ source: "synthetic" });
    }

    // Normalise to 0–1
    const fluxRaw = raw.Rows.map((r) => r.Flux ?? r.BestFit ?? 0);
    const maxFlux = Math.max(...fluxRaw);

    return NextResponse.json(
      {
        source:      "sdss",
        wavelengths: raw.Rows.map((r) => r.Wavelength),
        flux:        fluxRaw.map((f) => (maxFlux > 0 ? f / maxFlux : 0)),
      },
      {
        headers: {
          // Spectra don't change — cache aggressively
          "Cache-Control": "public, s-maxage=86400",
        },
      }
    );
  } catch {
    // Network error or timeout — fall back to synthetic gracefully
    return NextResponse.json({ source: "synthetic" });
  }
}
