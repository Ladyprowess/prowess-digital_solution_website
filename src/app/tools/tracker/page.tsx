import type { Metadata } from "next";
import TrackerPageClient from "./TrackerPageClient";

const SITE_URL = "https://prowessdigitalsolutions.com";

export const metadata: Metadata = {
  title: "Income & Expense Tracker",
  description:
    "Track every dollar in and out of your business with a full view of your cashflow, month by month.",
  alternates: {
    canonical: `${SITE_URL}/tools/tracker`,
  },
  openGraph: {
    title: "Income & Expense Tracker",
    description:
      "Track every dollar in and out of your business with a full view of your cashflow, month by month.",
    url: `${SITE_URL}/tools/tracker`,
    type: "website",
  },
};

export default function Page() {
  return <TrackerPageClient />;
}
