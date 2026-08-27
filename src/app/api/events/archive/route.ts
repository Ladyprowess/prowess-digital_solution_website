import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function makeFileName(originalName: string) {
  const safe = originalName.replace(/\s+/g, "-").toLowerCase();
  return `${Date.now()}-${Math.random().toString(16).slice(2)}-${safe}`;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const event_id = searchParams.get("event_id");

  if (!event_id) {
    return NextResponse.json({ error: "Missing event_id" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("event_media")
    .select("id,event_id,media_type,url,caption,sort_order,created_at")
    .eq("event_id", event_id)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true, items: data || [] });
}

export async function POST(req: Request) {
  try {
    const form = await req.formData();

    const event_id = String(form.get("event_id") || "").trim();
    const media_type = String(form.get("media_type") || "").trim();
    const caption = String(form.get("caption") || "").trim();
    const youtube_url = String(form.get("youtube_url") || "").trim();
    const file = form.get("file") as File | null;

    if (!event_id) {
      return NextResponse.json({ ok: false, error: "event_id is required." }, { status: 400 });
    }

    if (media_type !== "image" && media_type !== "video") {
      return NextResponse.json({ ok: false, error: "media_type must be 'image' or 'video'." }, { status: 400 });
    }

    let url: string;

    if (media_type === "video") {
      if (!youtube_url) {
        return NextResponse.json({ ok: false, error: "youtube_url is required for videos." }, { status: 400 });
      }
      url = youtube_url;
    } else {
      if (!file || file.size === 0) {
        return NextResponse.json({ ok: false, error: "An image file is required." }, { status: 400 });
      }

      const fileName = makeFileName(file.name);
      const path = `archive/${fileName}`;

      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      const { error: upErr } = await supabase.storage
        .from("events")
        .upload(path, buffer, { contentType: file.type || "image/jpeg", upsert: false });

      if (upErr) throw upErr;

      const { data: pub } = supabase.storage.from("events").getPublicUrl(path);
      url = pub.publicUrl;
    }

    const { data, error } = await supabase
      .from("event_media")
      .insert([{ event_id, media_type, url, caption: caption || null }])
      .select("*")
      .single();

    if (error) throw error;

    return NextResponse.json({ ok: true, item: data });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to add archive item";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
