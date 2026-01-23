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
    "Prowess Digital Solutions helps people start, organise, and run businesses properly through clarity, structure, and long-term guidance.",
  metadataBase: new URL("https://prowessdigitalsolutions.com"),
  openGraph: {
    title: `${brand.name}`,
    description:
      "Clarity, structure, and guidance for people building businesses that last.",
    type: "website",
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
