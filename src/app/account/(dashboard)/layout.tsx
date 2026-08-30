import { AccountShellClient } from "@/components/account/AccountShellClient";

export default function AccountDashboardLayout({ children }: { children: React.ReactNode }) {
  return <AccountShellClient>{children}</AccountShellClient>;
}
