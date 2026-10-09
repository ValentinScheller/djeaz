import Link from "next/link";

import { Logo } from "@/components/brand/logo";
import { ThemeToggle } from "@/components/theme-toggle";

import { DashboardNav } from "./dashboard-nav";
import { DashboardUserMenu } from "./dashboard-user-menu";

export function DashboardSidebar() {
  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-18 flex-col border-r border-border bg-surface shadow-dashboard md:flex lg:w-64">
      <div className="flex h-dvh min-h-0 flex-col gap-4 overflow-y-auto p-2 lg:p-4">
        <Link
          href="/dashboard"
          className="hidden rounded-lg outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus lg:inline-block"
        >
          <Logo alt="" className="w-full" />
          <span className="sr-only">DJEAZ, tableau de bord</span>
        </Link>
        <DashboardNav responsive />
        <div className="mt-auto flex min-w-0 flex-col gap-3">
          <div className="hidden min-w-0 lg:block">
            <ThemeToggle name="djeaz-theme-sidebar" />
          </div>
          <DashboardUserMenu responsive />
        </div>
      </div>
    </aside>
  );
}
