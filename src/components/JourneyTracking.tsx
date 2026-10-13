"use client";
import { useEffect } from "react";
import { trackEvent } from "@/lib/analytics";

export function JourneyTracking() {
  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (!(event.target instanceof Element)) return;
      const link = event.target.closest<HTMLAnchorElement>("a[href]");
      if (!link) return;
      if (link.dataset.track === "service_enquiry") {
        trackEvent("service_enquiry", { offer: link.dataset.offer || "service" });
      } else if (link.closest(".homepage-hero")) {
        const audiences: Record<string, string> = { "/services": "business", "/learn": "learning", "/jobs": "jobs", "/opportunities": "opportunities" };
        const audience = audiences[link.getAttribute("href") || ""];
        if (audience) trackEvent("audience_select", { audience });
      } else if (link.pathname === "/account/login") {
        trackEvent("sign_in_start", { source: "site_link" });
      }
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);
  return null;
}
