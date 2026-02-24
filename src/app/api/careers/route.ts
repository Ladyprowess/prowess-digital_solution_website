import { NextResponse } from "next/server";
import {  } from "@/lib/supabase/admin";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();

    const full_name = String(formData.get("full_name") || "").trim();
    const email = String(formData.get("email") || "").trim();
    const area_of_interest = String(formData.get("area_of_interest") || "").trim();

    // Honeypot
    const website = String(formData.get("website") || "").trim();
    if (website) return NextResponse.json({ ok: true });

    const file = formData.get("cv") as File | null;

    if (!full_name || !email || !area_of_interest || !file) {
      return NextResponse.json(
        { ok: false, error: "Please fill in all fields and upload your CV." },
        { status: 400 }
      );
    }

    // Basic file checks
    const maxBytes = 5 * 1024 * 1024; // 5MB
    const allowedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];

    if (file.size > maxBytes) {
      return NextResponse.json(
        { ok: false, error: "CV is too large. Max size is 5MB." },
        { status: 400 }
      );
    }

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { ok: false, error: "CV must be a PDF or Word document." },
        { status: 400 }
      );
    }

    const supabase = supabaseAdmin();

    // Create a safe file path
    const safeEmail = email.toLowerCase().replace(/[^a-z0-9@._-]/g, "");
    const ext =
      file.type === "application/pdf"
        ? "pdf"
        : file.type.includes("wordprocessingml")
        ? "docx"
        : "doc";

    const fileName = `cv.${ext}`;
    const path = `talent-pool/${safeEmail}/${Date.now()}-${fileName}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { error: uploadError } = await supabase.storage
      .from("cvs")
      .upload(path, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      return NextResponse.json(
        { ok: false, error: uploadError.message },
        { status: 500 }
      );
    }

    const { error: insertError } = await supabase
      .from("talent_pool_submissions")
      .insert([
        {
          full_name,
          email,
          area_of_interest,
          cv_file_path: path,
          cv_file_name: file.name,
          cv_file_type: file.type,
          cv_file_size: file.size,
          source: "website",
        },
      ]);

    if (insertError) {
      // optional: cleanup uploaded file if DB insert fails
      await supabase.storage.from("cvs").remove([path]);
      return NextResponse.json(
        { ok: false, error: insertError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || "Something went wrong." },
      { status: 500 }
    );
  }
}
