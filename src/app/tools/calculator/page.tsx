import type { Metadata } from "next";
import CalculatorPageClient from "./CalculatorPageClient";

const SITE_URL = "https://www.prowessdigitalsolutions.com";

export const metadata: Metadata = {
  title: "Startup Cost Calculator",
  description:
    "List every cost to launch your business, mark fixed and variable costs, and see exactly how much capital you need.",
  alternates: {
    canonical: `${SITE_URL}/tools/calculator`,
  },
  openGraph: {
    title: "Startup Cost Calculator",
    description:
      "List every cost to launch your business, mark fixed and variable costs, and see exactly how much capital you need.",
    url: `${SITE_URL}/tools/calculator`,
    type: "website",
  },
};

export default function Page() {
  return <CalculatorPageClient />;
}
