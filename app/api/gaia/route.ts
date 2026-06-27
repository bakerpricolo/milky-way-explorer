import { NextRequest, NextResponse } from "next/server";
import {
  fetchNearbyStars,
  fetchStarById,
  fetchStarByPosition,
  searchByName,
} from "@/lib/gaia";

/**
 * GET /api/gaia
 *
 * Query params (mutually exclusive, checked in order):
 *   ?id=<source_id>          → single star by Gaia source_id
 *   ?ra=<deg>&dec=<deg>&radius=<deg>  → star nearest to position
 *   ?search=<name>           → SIMBAD name search (returns array of {name, ra, dec})
 *   (none)                   → bright nearby star catalog (initial load)
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const id     = searchParams.get("id");
  const ra     = searchParams.get("ra");
  const dec    = searchParams.get("dec");
  const radius = searchParams.get("radius");
  const search = searchParams.get("search");

  try {
    // ── Single star by Gaia ID ────────────────────────────────────────────
    if (id) {
      const star = await fetchStarById(id);
      if (!star) return NextResponse.json({ error: "Star not found" }, { status: 404 });
      return NextResponse.json({ star });
    }

    // ── Star by position ──────────────────────────────────────────────────
    if (ra && dec) {
      const star = await fetchStarByPosition(
        parseFloat(ra),
        parseFloat(dec),
        radius ? parseFloat(radius) : 0.05
      );
      if (!star) return NextResponse.json({ error: "No star found at position" }, { status: 404 });
      return NextResponse.json({ star });
    }

    // ── SIMBAD name search ────────────────────────────────────────────────
    if (search) {
      if (search.length < 2) {
        return NextResponse.json({ results: [] });
      }
      const results = await searchByName(search);
      return NextResponse.json({ results });
    }

    // ── Default: initial catalog load ─────────────────────────────────────
    const stars = await fetchNearbyStars();
    return NextResponse.json(
      { stars, count: stars.length },
      {
        headers: {
          // Cache the catalog response at the CDN edge for 1 hour
          "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
        },
      }
    );
  } catch (err) {
    console.error("[/api/gaia]", err);
    return NextResponse.json(
      { error: "Failed to fetch from Gaia archive" },
      { status: 502 }
    );
  }
}
