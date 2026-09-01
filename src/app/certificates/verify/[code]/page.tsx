import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { Reveal } from "@/components/Reveal";

// certificates has no public RLS policy at all (deliberately - see
// supabase/certificates.sql), so supabaseAdmin() is this page's only
// client, unlike /resources/[slug] (anon key + RLS) or /portfolio/[slug]
// (anon key + RLS, service-role only for a signed storage URL).
async function getCertificate(rawCode: string) {
  // Generated codes are always uppercase, but someone may hand-type or
  // paste a lowercase/mixed-case version of a code they were given.
  const code = rawCode.trim().toUpperCase();
  const { data } = await supabaseAdmin()
    .from("certificates")
    .select("learner_name, course_title, issued_at, verification_code")
    .eq("verification_code", code)
    .maybeSingle();
  return data;
}

export async function generateMetadata({ params }: { params: Promise<{ code: string }> }): Promise<Metadata> {
  const { code } = await params;
  const certificate = await getCertificate(code);
  if (!certificate) return { title: "Certificate not found" };
  return { title: `Certificate verification - ${certificate.learner_name}` };
}

export default async function VerifyCertificatePage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const certificate = await getCertificate(code);
  if (!certificate) return notFound();

  const issuedDate = new Date(certificate.issued_at).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

  return (
    <div className="min-h-screen bg-background py-16">
      <div className="mx-auto max-w-xl px-4">
        <Reveal>
          <div className="rounded-2xl border border-border bg-card p-8 text-center">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-bold uppercase tracking-wide text-primary">
              ✓ Verified
            </span>
            <p className="mt-6 text-xs font-bold uppercase tracking-wide text-muted-foreground">Certificate of Completion</p>
            <h1 className="mt-2 text-2xl font-bold text-foreground">{certificate.learner_name}</h1>
            <p className="mt-2 text-sm text-muted-foreground">has successfully completed</p>
            <p className="mt-1 text-lg font-semibold text-primary">{certificate.course_title}</p>
            <div className="mt-6 border-t border-border pt-6 text-xs text-muted-foreground">
              <p>Issued {issuedDate}</p>
              <p className="mt-1">Verification code: {certificate.verification_code}</p>
            </div>
          </div>
          <p className="mt-6 text-center text-xs text-muted-foreground">
            This credential was issued by Prowess Digital Solutions and verified against our records.
          </p>
        </Reveal>
      </div>
    </div>
  );
}
