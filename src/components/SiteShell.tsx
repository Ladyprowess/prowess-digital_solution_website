"use client";

import { usePathname } from "next/navigation";
import Navbar from "@/components/Navbar";
import { InstallPrompt } from "@/components/InstallPrompt";

// `footer` is a pre-rendered element (built by the RootLayout Server
// Component, which passes it in as children/props) rather than a <Footer/>
// import here - Footer fetches data and must stay async, and an async
// component can't be imported directly into a "use client" file. See the
// comment on Footer itself for the full explanation.
export default function SiteShell({ children, footer }: { children: React.ReactNode; footer: React.ReactNode }) {
  const pathname = usePathname();
  const hideShell = pathname.startsWith("/dashboard") || pathname.startsWith("/login") || pathname.startsWith("/admin");

  if (hideShell) {
    return <>{children}</>;
  }

  return (
    <>
      <Navbar />
      <main className="min-h-[70vh]">{children}</main>
      {footer}
      <InstallPrompt />
    </>
  );
}
