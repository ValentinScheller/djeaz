import type { ReactNode } from "react";

import { ThemeToggle } from "@/components/theme-toggle";
import { intensityProps } from "@/components/ui/intensity";

import { DashboardMobileNav } from "./dashboard-mobile-nav";
import { DashboardSidebar } from "./dashboard-sidebar";

/**
 * Cette coque porte le `<main>`.
 * Les pages ne doivent pas en ajouter un second.
 * La sidebar est fixée au viewport ; seul le contenu est centré.
 */
export function DashboardShell({ children }: { children: ReactNode }) {
  return (
    <div
      {...intensityProps("dashboard")}
      className="flex min-h-dvh w-full min-w-0 flex-1 flex-col bg-background"
    >
      <DashboardSidebar />
      {/* w-18 / lg:w-64 de la sidebar : le padding doit rester identique. */}
      <div className="flex min-h-dvh min-w-0 flex-col md:pl-18 lg:pl-64">
        <header className="flex flex-wrap items-center gap-3 border-b border-border bg-surface px-3 py-3 lg:hidden">
          <DashboardMobileNav />
          <div className="ml-auto min-w-0 max-w-full">
            <ThemeToggle name="djeaz-theme-bar" />
          </div>
        </header>
        <main className="mx-auto w-full min-w-0 max-w-5xl flex-1 px-4 py-6 wrap-break-word sm:px-6 lg:px-8 lg:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
