import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { verifyMember } from "@/lib/auth/verifyMember";
import { hasPremiumAccess } from "@/lib/payments/premiumMembership";

export const runtime = "nodejs";

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const EXT_FOR_TYPE: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

// Profile photos and project cover images for the Portfolio Builder. Both
// kinds are just images stored in the same public "portfolio-media"
// bucket - the public portfolio page (/portfolio/[slug]) needs to be able
// to render them without a signed URL, since it's a signed-out server
// component. Video projects store a plain URL (YouTube/Vimeo) instead -
// no file upload needed for those.
export async function POST(req: Request) {
  try {
    const member = await verifyMember(req);
    if (!member) {
      return NextResponse.json({ ok: false, error: "Please sign in to continue." }, { status: 401 });
    }

    // Portfolio Builder has no free tier (see the save route) - gate image
    // uploads the same way, otherwise any signed-in member could fill the
    // storage bucket with images regardless of access.
    const hasAccess = await hasPremiumAccess({ userId: member.id, email: member.email });
    if (!hasAccess) {
      return NextResponse.json({ ok: false, error: "Portfolio Builder needs Premium." }, { status: 403 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const kind = String(formData.get("kind") || "project");

    if (!file) {
      return NextResponse.json({ ok: false, error: "No file provided." }, { status: 400 });
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ ok: false, error: "Image is too large. Maximum size is 5 MB." }, { status: 400 });
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ ok: false, error: "Image must be a JPG, PNG, WEBP, or GIF." }, { status: 400 });
    }

    const supabase = supabaseAdmin();
    const ext = EXT_FOR_TYPE[file.type] || "jpg";
    const safeKind = kind === "profile" ? "profile" : "project";
    const path = `${member.id}/${safeKind}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    const { error: uploadError } = await supabase.storage
      .from("portfolio-media")
      .upload(path, buffer, { contentType: file.type, upsert: false });

    if (uploadError) {
      return NextResponse.json({ ok: false, error: uploadError.message }, { status: 500 });
    }

    const { data: publicUrl } = supabase.storage.from("portfolio-media").getPublicUrl(path);

    return NextResponse.json({ ok: true, url: publicUrl.publicUrl });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Upload failed.";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
