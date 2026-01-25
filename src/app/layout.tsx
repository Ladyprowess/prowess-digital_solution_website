import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { brand } from "@/content/site";

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
      "Clarity, structure, and guidance for people building businesses that last.",
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
      "Clarity, structure, and guidance for people building businesses that last.",
    images: ["/og-image.png"],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-GB">
      <body>
        <Navbar />
        <main className="min-h-[70vh]">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
