import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { brand } from "@/content/site";
import Script from "next/script";

export const metadata: Metadata = {
  title: {
    default: `${brand.name} | Business clarity, structure, and guidance`,
    template: `%s | ${brand.name}`,
  },
  description:
    "Prowess Digital Solutions helps people start, organise, and run businesses properly.",
  metadataBase: new URL("https://prowessdigitalsolutions.com"),

  openGraph: {
    title: `${brand.name}`,
    description:
      "Prowess Digital Solutions helps business owners gain clarity, build structure, and implement systems so they can run organised, sustainable businesses with confidence.",
    type: "website",
    url: "https://prowessdigitalsolutions.com",
    siteName: brand.name,
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Prowess Digital Solutions",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: brand.name,
    description:
      "Prowess Digital Solutions helps business owners gain clarity, build structure, and implement systems so they can run organised, sustainable businesses with confidence.",
    images: ["/og-image.png"],
  },
};

// ✅ 1) SITE-WIDE SCHEMA (Organisation + Website)
const orgSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: brand.name,
  url: "https://prowessdigitalsolutions.com",
  logo: "https://prowessdigitalsolutions.com/og-image.png",
  description:
    "Prowess Digital Solutions helps business owners gain clarity, build structure, and implement systems so they can run organised, sustainable businesses with confidence.",
  sameAs: [
    // ✅ Replace with your real links OR remove this array entirely
    "https://www.instagram.com/prowessdigitalsolutions",
    "https://twitter.com/prowessDS",
    "https://www.linkedin.com/company/prowess-digital-solutions",
  ],
};

const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: brand.name,
  url: "https://prowessdigitalsolutions.com",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-GB">
      <body>
        {/* ✅ 2) Inject JSON-LD */}
        <Script
          id="schema-org"
          type="application/ld+json"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(orgSchema) }}
        />
        <Script
          id="schema-website"
          type="application/ld+json"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
        />

        <Navbar />
        <main className="min-h-[70vh]">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
