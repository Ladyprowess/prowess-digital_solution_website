import type { Metadata } from "next";
import InvoicePageClient from "./InvoicePageClient";

const SITE_URL = "https://www.prowessdigitalsolutions.com";

export const metadata: Metadata = {
  title: "Invoice Generator - Create & Track Invoices",
  description:
    "Create professional invoices, track who has paid and who has not, and send payment reminders in one tap.",
  alternates: {
    canonical: `${SITE_URL}/tools/invoice`,
  },
  openGraph: {
    title: "Invoice Generator - Create & Track Invoices",
    description:
      "Create professional invoices, track who has paid and who has not, and send payment reminders in one tap.",
    url: `${SITE_URL}/tools/invoice`,
    type: "website",
  },
};

export default function Page() {
  return <InvoicePageClient />;
}
