"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { BuyButton } from "@/components/BuyButton";
import { getYoutubeVideoId } from "@/lib/youtube";
import { RichText } from "@/components/RichText";

type ResourceBodyData = {
  content: string | null;
  file_url: string | null;
  external_url: string | null;
  source: string;
  signed_file_url: string | null;
};

export function ResourceBody({
  resourceId,
  price,
  currency,
}: {
  resourceId: string;
  price: number | null;
  currency: string | null;
}) {
  const [status, setStatus] = useState<"loading" | "entitled" | "locked">("loading");
  const [data, setData] = useState<ResourceBodyData | null>(null);
  const [signedIn, setSignedIn] = useState(false);

  const load = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    setSignedIn(!!session);

    const res = await fetch("/api/content/access", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
      },
      body: JSON.stringify({ itemType: "resource", itemId: resourceId }),
    });
    const result = await res.json();

    if (!result.ok) {
      setStatus("locked");
      return;
    }
    setData(result.resource);
    setStatus("entitled");
  }, [resourceId]);

  useEffect(() => { load(); }, [load]);

  if (status === "loading") {
    return <p className="mt-10 text-center text-sm text-muted-foreground">Loading…</p>;
  }

  if (status === "locked") {
    return (
      <div className="mt-10 rounded-2xl border-2 border-primary/20 bg-muted p-8 text-center">
        <h2 className="text-lg font-bold text-foreground">This is premium</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {signedIn ? "You don't have access to this yet." : "Sign in if you've already bought this, or buy access below."}
        </p>
        <div className="mx-auto mt-6 max-w-xs">
          <BuyButton itemType="resource" itemId={resourceId} price={price} currency={currency} />
        </div>
      </div>
    );
  }

  const downloadUrl = data?.signed_file_url || data?.file_url;
  const youtubeId = data?.source === "youtube" && data.external_url ? getYoutubeVideoId(data.external_url) : null;

  return (
    <div className="mt-10 space-y-6">
      {youtubeId && (
        <div className="aspect-video w-full overflow-hidden rounded-2xl border border-border bg-black">
          <iframe
            src={`https://www.youtube.com/embed/${youtubeId}`}
            title="YouTube video player"
            className="h-full w-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      )}

      {data?.content && (
        <RichText html={data.content} />
      )}

      {data?.external_url && !youtubeId && (
        <a
          href={data.external_url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition hover:opacity-90"
        >
          Open →
        </a>
      )}

      {data?.external_url && youtubeId && (
        <a
          href={data.external_url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block text-sm font-semibold text-primary hover:underline"
        >
          Watch on YouTube →
        </a>
      )}

      {downloadUrl && (
        <a
          href={downloadUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center rounded-xl border border-border bg-card px-6 py-3 text-sm font-semibold text-foreground hover:bg-muted"
        >
          Download →
        </a>
      )}

      {!data?.content && !data?.external_url && !downloadUrl && (
        <p className="text-sm text-muted-foreground">No content has been added to this resource yet.</p>
      )}
    </div>
  );
}
