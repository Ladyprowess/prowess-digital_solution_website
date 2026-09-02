import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { slugify } from "@/lib/slugify";

export const runtime = "nodejs";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

type EventInsertRow = {
  title: string;
  type: string;
  description: string | null;
  date: string;
  time: string | null;
  duration: string | null;
  location: string | null;
  registration_url: string | null;
  join_link: string | null;
  status: "published" | "draft";
  registration_type: "free" | "paid";
  price_usd: number | null;
  price_ngn: number | null;
  price: number;
  spots_left: number | null;
  cover_url: string | null;
  is_published: boolean;
  slug: string;
};

function makeFileName(originalName: string) {
  const safe = originalName.replace(/\s+/g, "-").toLowerCase();
  return `${Date.now()}-${Math.random().toString(16).slice(2)}-${safe}`;
}

export async function POST(req: Request) {
  try {
    const form = await req.formData();

    const title = String(form.get("title") || "").trim();
    const type = String(form.get("type") || "Webinar").trim();
    const slug = slugify(String(form.get("slug") || "").trim() || title);
    const description = String(form.get("description") || "").trim();

    const date = String(form.get("date") || "").trim(); // YYYY-MM-DD
    const time = String(form.get("time") || "").trim();
    const duration = String(form.get("duration") || "").trim();
    const location = String(form.get("location") || "").trim();

    const registration_url = String(form.get("registration_url") || "").trim();
    const join_link = String(form.get("join_link") || "").trim();

    // ✅ NEW: status + registration_type + price_usd (from your form)
    const statusRaw = String(form.get("status") || "published").trim().toLowerCase();
    const status = (statusRaw === "draft" ? "draft" : "published") as "published" | "draft";

    const regRaw = String(form.get("registration_type") || "free").trim().toLowerCase();
    const registration_type = (regRaw === "paid" ? "paid" : "free") as "free" | "paid";

    const priceUsdRaw = String(form.get("price_usd") || "").trim();
    const price_usd =
      registration_type === "paid" ? Number(priceUsdRaw || 0) : null;

    const priceNgnRaw = String(form.get("price_ngn") || "").trim();
    const price_ngn =
      registration_type === "paid" && priceNgnRaw ? Number(priceNgnRaw) : null;

    // keep your old fields too (in case your table still uses them)
    const priceRaw = String(form.get("price") || "0").trim();
    const spotsRaw = String(form.get("spots_left") || "").trim();

    const price = Number(priceRaw || 0);
    const spots_left = spotsRaw ? Number(spotsRaw) : null;

    const file = form.get("cover") as File | null;

    if (!title || !type || !date) {
      return NextResponse.json(
        { ok: false, error: "Title, type, and date are required." },
        { status: 400 }
      );
    }

    if (registration_type === "paid" && (!price_usd || price_usd < 1)) {
      return NextResponse.json(
        { ok: false, error: "Paid events must have a valid price_usd." },
        { status: 400 }
      );
    }

    let cover_url: string | null = null;

    // Upload file if provided
    if (file && file.size > 0) {
      const fileName = makeFileName(file.name);
      const path = `covers/${fileName}`;

      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      const { error: upErr } = await supabase.storage
        .from("events")
        .upload(path, buffer, {
          contentType: file.type || "image/jpeg",
          upsert: false,
        });

      if (upErr) throw upErr;

      const { data: pub } = supabase.storage.from("events").getPublicUrl(path);
      cover_url = pub.publicUrl;
    }

    // ✅ INSERT: save BOTH new + old fields (so your UI works either way)
    const insertRow: EventInsertRow = {
      title,
      slug,
      type,
      description: description || null,
      date,
      time: time || null,
      duration: duration || null,
      location: location || null,
      registration_url: registration_url || null,
      join_link: join_link || null,

      // new fields
      status,
      registration_type,
      price_usd,
      price_ngn,

      // old fields (optional)
      price: Number.isFinite(price) ? price : 0,
      spots_left,

      cover_url,

      // keep if your table still has it
      is_published: true,
    };

    const { data, error } = await supabase
      .from("events")
      .insert([insertRow])
      .select("*")
      .single();

    if (error) throw error;

    return NextResponse.json({ ok: true, item: data });
  } catch (err: unknown) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Failed to create event" },
      { status: 500 }
    );
  }
}
