import type { Metadata } from "next";
import { Suspense } from "react";
import "./globals.css";
import SiteShell from "@/components/SiteShell";
import { brand } from "@/content/site";
import Script from "next/script";
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

const SITE_URL = "https://prowessdigitalsolutions.com";

export const metadata: Metadata = {
  title: {
    default: `${brand.name} | Business Structure and Diagnostics for Founders Everywhere`,
    template: `%s | ${brand.name}`,
  },
  description:
    "Prowess Digital Solutions provides fixed scope diagnostics, SOP documentation, and practical tools to help founders and business owners gain clarity, build strong systems, and run organised, sustainable businesses, wherever they are.",
  metadataBase: new URL(SITE_URL),
  alternates: {
    canonical: `${SITE_URL}/`,
  },
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
  applicationName: brand.name,
  category: "Business consulting",
  keywords: [
    "business structure diagnostic",
    "SOP documentation",
    "go to market playbook",
    "business systems",
    "small business support",
    "business consulting for solopreneurs",
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

const orgSchema = {
  "@context": "https://schema.org",
  "@type": "ProfessionalService",
  name: brand.name,
  url: SITE_URL,
  logo: `${SITE_URL}/og-image.png`,
  image: `${SITE_URL}/og-image.png`,
  description:
    "Prowess Digital Solutions provides clear strategies, structured processes, and practical guidance to help business owners stay organised, improve operations, and achieve long-term success.",
  sameAs: [
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
    <html lang="en-GB" className={cn("font-sans", geist.variable)}>
      <head>
        <meta name="color-scheme" content="light" />
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
        <Script
          id="adsense"
          async
          strategy="afterInteractive"
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-7888248635786937"
          crossOrigin="anonymous"
        />
      </head>
      <body>
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

        <Suspense>
          <SiteShell>{children}</SiteShell>
        </Suspense>
      </body>
    </html>
  );
}
