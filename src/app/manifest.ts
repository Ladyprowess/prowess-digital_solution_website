import type { MetadataRoute } from "next";
import { brand } from "@/content/site";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: brand.name,
    // short_name is what actually shows under the home-screen icon on
    // Android/Chrome - "PDS" per explicit request, while `name` stays the
    // full name for the install dialog and app-info screens.
    short_name: "PDS",
    description: "Practical resources, tools, opportunities and business support to help you learn, build and grow.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#F5F5F7",
    theme_color: "#507c80",
    orientation: "portrait-primary",
    icons: [
      { src: "/icons/icon-32.png", sizes: "32x32", type: "image/png" },
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
