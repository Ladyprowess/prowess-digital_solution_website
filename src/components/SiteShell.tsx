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
  // /account/login and /account/signup keep the public nav/footer (a plain
  // centered auth card); every other /account/* route is the member
  // dashboard, which gets its own sidebar shell instead - same treatment
  // /admin already gets.
  const isAccountAuthPage = pathname.startsWith("/account/login") || pathname.startsWith("/account/signup");
  const hideShell =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/admin") ||
    (pathname.startsWith("/account") && !isAccountAuthPage);

  if (hideShell) {
    return <>{children}</>;
  }

  return (
    <>
      <Navbar />
      {/* Reserve the fixed navigation's height so page content stays visible. */}
      <div aria-hidden="true" className="h-20 shrink-0" />
      <main className="min-h-[70vh]">{children}</main>
      {footer}
      <InstallPrompt />
    </>
  );
}
