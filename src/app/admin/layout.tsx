import type { Metadata } from "next";
import { AdminShellClient } from "@/components/admin/AdminShellClient";

// Overrides the root layout's manifest link for every page under /admin -
// installing the app from here (not from the public site) points at
// public/admin-manifest.webmanifest instead, which opens straight to
// /admin instead of the homepage. A nested manifest.ts route (the file
// convention used for the main site's manifest) doesn't actually generate
// a working route here - only a plain static file plus this metadata
// override does.
export const metadata: Metadata = {
  manifest: "/admin-manifest.webmanifest",
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminShellClient>{children}</AdminShellClient>;
}
