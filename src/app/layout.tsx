import { JourneyTracking } from "@/components/JourneyTracking";
import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import "./globals.css";
import SiteShell from "@/components/SiteShell";
import Footer from "@/components/Footer";
import { ThemeProvider } from "@/components/ThemeProvider";
import { ServiceWorkerRegister } from "@/components/ServiceWorkerRegister";
import { brand } from "@/content/site";
import { getSiteSettings } from "@/lib/siteSettings";
import Script from "next/script";

const SITE_URL = "https://prowessdigitalsolutions.com";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();

  return {
    title: {
      default: settings.seoTitle,
      template: `%s | ${brand.name}`,
    },
    description: settings.seoDescription,
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
    manifest: "/manifest.webmanifest",
    icons: {
      icon: [
        { url: "/icons/icon-32.png", sizes: "32x32", type: "image/png" },
        { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
        { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      ],
      apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
    },
    appleWebApp: {
      capable: true,
      statusBarStyle: "default",
      title: brand.name,
    },
    category: "Education",
    keywords: [
      "practical resources",
      "business support",
      "business tools",
      "remote jobs worldwide",
      "jobs for job seekers",
      "internships worldwide",
      "scholarships and grants",
      "online courses",
      "learning resources",
      "ebooks and guides",
    ],
    openGraph: {
      title: brand.name,
      description: settings.seoDescription,
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
      description: settings.seoDescription,
      images: ["/og-image.png"],
    },
  };
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F5F5F7" },
    { media: "(prefers-color-scheme: dark)", color: "#161d1e" },
  ],
};

const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: brand.name,
  url: SITE_URL,
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const settings = await getSiteSettings();

  const orgSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: brand.name,
    url: SITE_URL,
    logo: `${SITE_URL}/og-image.png`,
    image: `${SITE_URL}/og-image.png`,
    description: settings.seoDescription,
    sameAs: [settings.socialInstagram, settings.socialTwitter, settings.socialLinkedin].filter(
      (v): v is string => Boolean(v)
    ),
  };

  return (
    <html lang="en-GB" className="font-sans" suppressHydrationWarning>
      <head>
        <meta name="color-scheme" content="light dark" />
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

        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} disableTransitionOnChange>
          <Suspense>
            <SiteShell footer={<Footer settings={settings} />}>{children}</SiteShell>
          </Suspense>
        </ThemeProvider>
        <JourneyTracking />
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
