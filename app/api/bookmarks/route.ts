import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// ── GET /api/bookmarks ────────────────────────────────────────────────────────

export async function GET() {
  const supabase = await createClient();

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const user = session.user;

  const { data: bookmarks, error } = await supabase
    .from("bookmarks")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ bookmarks });
}

// ── POST /api/bookmarks ───────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  const supabase = await createClient();

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const user = session.user;

  const body = await request.json() as {
    star_id: string;
    star_name?: string;
    ra?: number;
    dec?: number;
    magnitude?: number;
    temperature?: number;
    distance_pc?: number;
    notes?: string;
  };

  if (!body.star_id) {
    return NextResponse.json({ error: "star_id is required" }, { status: 400 });
  }

  const { data: bookmark, error } = await supabase
    .from("bookmarks")
    .upsert(
      {
        user_id:     user.id,
        star_id:     body.star_id,
        star_name:   body.star_name   ?? null,
        ra:          body.ra          ?? null,
        dec:         body.dec         ?? null,
        magnitude:   body.magnitude   ?? null,
        temperature: body.temperature ?? null,
        distance_pc: body.distance_pc ?? null,
        notes:       body.notes       ?? null,
      },
      { onConflict: "user_id,star_id" }
    )
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ bookmark }, { status: 201 });
}

// ── DELETE /api/bookmarks?star_id=<id> ───────────────────────────────────────

export async function DELETE(request: NextRequest) {
  const supabase = await createClient();

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const user = session.user;

  const starId = request.nextUrl.searchParams.get("star_id");
  if (!starId) {
    return NextResponse.json({ error: "star_id is required" }, { status: 400 });
  }

  const { error } = await supabase
    .from("bookmarks")
    .delete()
    .eq("user_id", user.id)
    .eq("star_id", starId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}