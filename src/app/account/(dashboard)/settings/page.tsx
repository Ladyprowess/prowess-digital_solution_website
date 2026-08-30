"use client";

import { useState } from "react";
import { useAccountSession } from "@/components/account/MemberSessionProvider";
import { Card } from "@/components/account/AccountUI";
import { supabase } from "@/lib/supabase";

export default function SettingsPage() {
  const { profile, email, reload, signOut } = useAccountSession();

  const [fullName, setFullName] = useState("");
  const [headline, setHeadline] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Loads in from context asynchronously (null at first, then the real row),
  // so the draft fields are (re)seeded the first time it shows up - a plain
  // useState initializer would miss that later update. Resyncing during
  // render (React's documented pattern for this) instead of in an effect
  // avoids an extra render pass.
  const [loadedProfileId, setLoadedProfileId] = useState<string | null>(null);
  if (profile && profile.id !== loadedProfileId) {
    setLoadedProfileId(profile.id);
    setFullName(profile.full_name || "");
    setHeadline(profile.headline || "");
  }

  async function saveProfile() {
    if (!profile) return;
    setSaving(true);
    setSaved(false);
    await supabase
      .from("member_profiles")
      .update({ full_name: fullName.trim() || null, headline: headline.trim() || null, updated_at: new Date().toISOString() })
      .eq("id", profile.id);
    setSaving(false);
    setSaved(true);
    reload();
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground">Settings</h1>
      <p className="mt-1 text-sm text-muted-foreground">Manage your profile and account.</p>

      <div className="mt-6 grid gap-6 lg:max-w-2xl">
        <Card title="Profile">
          <div className="grid gap-4">
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">Email</label>
              <p className="rounded-xl border border-border bg-muted px-4 py-3 text-sm text-muted-foreground">{email}</p>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">Full name</label>
              <input
                value={fullName}
                onChange={(e) => { setFullName(e.target.value); setSaved(false); }}
                placeholder="Full name"
                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">Headline</label>
              <input
                value={headline}
                onChange={(e) => { setHeadline(e.target.value); setSaved(false); }}
                placeholder="e.g. Aspiring Product Designer"
                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground"
              />
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={saveProfile}
                disabled={saving}
                className="rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-60"
              >
                {saving ? "Saving..." : "Save changes"}
              </button>
              {saved && <p className="text-sm text-muted-foreground">Saved.</p>}
            </div>
          </div>
        </Card>

        <Card title="Account">
          <button
            onClick={signOut}
            className="rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-semibold text-foreground hover:bg-muted"
          >
            Sign out
          </button>
        </Card>
      </div>
    </div>
  );
}
