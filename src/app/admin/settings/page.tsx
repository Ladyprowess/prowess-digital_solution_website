"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

type SettingsRow = {
  contact_email: string | null;
  contact_phone: string | null;
  contact_location: string | null;
  social_linkedin: string | null;
  social_instagram: string | null;
  social_twitter: string | null;
  seo_title: string | null;
  seo_description: string | null;
};

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-semibold tracking-widest text-muted-foreground">{label.toUpperCase()}</p>
      <div className="mt-2">{children}</div>
    </div>
  );
}

const inputCls = "w-full rounded-xl border border-border bg-card px-4 py-3 text-sm text-foreground";

function SettingsAdmin() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactLocation, setContactLocation] = useState("");
  const [socialLinkedin, setSocialLinkedin] = useState("");
  const [socialInstagram, setSocialInstagram] = useState("");
  const [socialTwitter, setSocialTwitter] = useState("");
  const [seoTitle, setSeoTitle] = useState("");
  const [seoDescription, setSeoDescription] = useState("");

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase
        .from("site_settings")
        .select("contact_email, contact_phone, contact_location, social_linkedin, social_instagram, social_twitter, seo_title, seo_description")
        .eq("id", 1)
        .maybeSingle();
      if (error) { setErr(error.message); setLoading(false); return; }

      const row = data as SettingsRow | null;
      if (row) {
        setContactEmail(row.contact_email || "");
        setContactPhone(row.contact_phone || "");
        setContactLocation(row.contact_location || "");
        setSocialLinkedin(row.social_linkedin || "");
        setSocialInstagram(row.social_instagram || "");
        setSocialTwitter(row.social_twitter || "");
        setSeoTitle(row.seo_title || "");
        setSeoDescription(row.seo_description || "");
      }
      setLoading(false);
    }
    load();
  }, []);

  const save = async () => {
    setErr(""); setMsg(""); setSaving(true);
    try {
      const { error } = await supabase.from("site_settings").upsert({
        id: 1,
        contact_email: contactEmail.trim() || null,
        contact_phone: contactPhone.trim() || null,
        contact_location: contactLocation.trim() || null,
        social_linkedin: socialLinkedin.trim() || null,
        social_instagram: socialInstagram.trim() || null,
        social_twitter: socialTwitter.trim() || null,
        seo_title: seoTitle.trim() || null,
        seo_description: seoDescription.trim() || null,
        updated_at: new Date().toISOString(),
      });
      if (error) throw new Error(error.message);
      setMsg("Settings saved.");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p className="py-16 text-center text-sm text-muted-foreground">Loading…</p>;

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <h1 className="text-3xl font-semibold text-foreground">Settings</h1>
        <p className="mt-2 text-sm text-muted-foreground">Site-wide contact info, social links, and SEO defaults.</p>
      </div>

      <div className="rounded-2xl border border-border bg-card p-8">
        <h2 className="text-lg font-semibold text-foreground">Contact</h2>
        <p className="mt-1 text-sm text-muted-foreground">Shown in the site footer.</p>
        <div className="mt-6 grid gap-4">
          <Field label="Email">
            <input value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} className={inputCls} placeholder="info@prowessdigitalsolutions.com" />
          </Field>
          <Field label="Phone / WhatsApp">
            <input value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} className={inputCls} placeholder="+2348162174443" />
          </Field>
          <Field label="Location">
            <input value={contactLocation} onChange={(e) => setContactLocation(e.target.value)} className={inputCls} placeholder="Remote, worldwide. Based in Nigeria." />
          </Field>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-8">
        <h2 className="text-lg font-semibold text-foreground">Social Links</h2>
        <p className="mt-1 text-sm text-muted-foreground">Shown in the footer. Leave blank to hide that icon.</p>
        <div className="mt-6 grid gap-4">
          <Field label="LinkedIn">
            <input value={socialLinkedin} onChange={(e) => setSocialLinkedin(e.target.value)} className={inputCls} placeholder="https://www.linkedin.com/company/..." />
          </Field>
          <Field label="Instagram">
            <input value={socialInstagram} onChange={(e) => setSocialInstagram(e.target.value)} className={inputCls} placeholder="https://www.instagram.com/..." />
          </Field>
          <Field label="X (Twitter)">
            <input value={socialTwitter} onChange={(e) => setSocialTwitter(e.target.value)} className={inputCls} placeholder="https://twitter.com/..." />
          </Field>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-8">
        <h2 className="text-lg font-semibold text-foreground">SEO Defaults</h2>
        <p className="mt-1 text-sm text-muted-foreground">The title and description search engines and social shares show for the site, unless a page sets its own.</p>
        <div className="mt-6 grid gap-4">
          <Field label="Site title">
            <input value={seoTitle} onChange={(e) => setSeoTitle(e.target.value)} className={inputCls} />
          </Field>
          <Field label="Site description">
            <textarea value={seoDescription} onChange={(e) => setSeoDescription(e.target.value)} rows={3} className={inputCls} />
          </Field>
        </div>
      </div>

      {err ? <p className="text-sm text-red-600">{err}</p> : null}
      {msg ? <p className="text-sm text-green-700">{msg}</p> : null}

      <button
        type="button"
        onClick={save}
        disabled={saving}
        className="w-full rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground disabled:opacity-60 hover:opacity-90"
      >
        {saving ? "Saving..." : "Save settings"}
      </button>

      <div className="rounded-2xl border border-border bg-card p-8">
        <h2 className="text-lg font-semibold text-foreground">Staff Accounts</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Staff roles, payroll, and access are managed on the internal dashboard, not here.
        </p>
        <Link
          href="/dashboard"
          className="mt-4 inline-block rounded-xl border border-border px-5 py-2.5 text-sm font-semibold text-foreground hover:bg-muted"
        >
          Go to Dashboard →
        </Link>
      </div>
    </div>
  );
}

export default function AdminSettingsPage() {
  return <SettingsAdmin />;
}
