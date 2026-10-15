import type { Metadata } from "next";
import InventoryPageClient from "./InventoryPageClient";

const SITE_URL = "https://www.prowessdigitalsolutions.com";

export const metadata: Metadata = {
  title: "Inventory Manager - Track Stock & Margins",
  description:
    "Keep on top of every item, get alerts before you run out of stock, and track your margins in real time.",
  alternates: {
    canonical: `${SITE_URL}/tools/inventory`,
  },
  openGraph: {
    title: "Inventory Manager - Track Stock & Margins",
    description:
      "Keep on top of every item, get alerts before you run out of stock, and track your margins in real time.",
    url: `${SITE_URL}/tools/inventory`,
    type: "website",
  },
};

export default function Page() {
  return <InventoryPageClient />;
}
