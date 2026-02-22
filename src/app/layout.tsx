import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { brand } from "@/content/site";
import Script from "next/script";

const SITE_URL = "https://prowessdigitalsolutions.com";

// ✅ SEO + Social metadata (site-wide)
export const metadata: Metadata = {
  title: {
    default: `${brand.name} | Business clarity, structure, and guidance`,
    template: `%s | ${brand.name}`,
  },

  description:
    "Prowess Digital Solutions provides structured guidance to help business owners gain clarity, build strong business systems, and run organised, sustainable businesses.",

  metadataBase: new URL(SITE_URL),

  // ✅ Canonical (helps Google pick the correct URL)
  alternates: {
    canonical: `${SITE_URL}/`,
  },

  // ✅ Indexing rules
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },

  // ✅ Small extra signals (safe + aligned)
  applicationName: brand.name,
  category: "Business consulting",
  keywords: [
    "business clarity",
    "business structure",
    "business guidance",
    "business audit",
    "business systems",
    "business mentorship",
    "small business support",
    "business consulting Nigeria",
    "business operations guidance",
  ],

  openGraph: {
    title: `${brand.name}`,
    description:
      "Prowess Digital Solutions helps business owners gain clarity, build structure, and implement systems so they can run organised, sustainable businesses with confidence.",
    type: "website",
    url: SITE_URL,
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
// Using ProfessionalService fits your positioning better than generic Organization.
const orgSchema = {
  "@context": "https://schema.org",
  "@type": "ProfessionalService",
  name: brand.name,
  url: SITE_URL,
  logo: `${SITE_URL}/og-image.png`,
  image: `${SITE_URL}/og-image.png`,
  description:
    "Prowess Digital Solutions provides clear strategies, structured processes, and practical guidance to help business owners stay organised, improve operations, and achieve long-term success.",
  areaServed: {
    "@type": "Country",
    name: "Nigeria",
  },
  sameAs: [
    // ✅ Keep only links that are real and active
    "https://www.instagram.com/prowessdigitalsolutions",
    "https://twitter.com/prowessDS",
    "https://www.linkedin.com/company/prowess-digital-solutions",
  ],
};

const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: brand.name,
  url: SITE_URL,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-GB">
      <head>
        {/* Google Analytics (GA4) */}
        <Script
  src="https://www.googletagmanager.com/gtag/js?id=G-N9N42PJ7YT"
  strategy="afterInteractive"
  async
  crossOrigin="anonymous"
/>
        <Script id="ga4" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-N9N42PJ7YT');
          `}
        </Script>

        {/* Google AdSense */}
<Script
  id="adsense"
  async
  strategy="afterInteractive"
  src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-7888248635786937"
  crossOrigin="anonymous"
/>
      </head>
      <body>
        {/* ✅ Inject JSON-LD */}
        <Script
  id="schema-org"
  type="application/ld+json"
  strategy="beforeInteractive"
  dangerouslySetInnerHTML={{ __html: JSON.stringify(orgSchema) }}
/>
<Script
  id="schema-website"
  type="application/ld+json"
  strategy="beforeInteractive"
  dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
/>

        <Navbar />
        <main className="min-h-[70vh]">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
