// FILE: src/app/dashboard/layout.tsx
//
// This file tells Next.js to use a blank layout for the dashboard.
// It overrides the main website layout so the header and footer
// do not appear on the dashboard page.

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
