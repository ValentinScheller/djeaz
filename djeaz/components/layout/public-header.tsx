import Link from "next/link";

import { Logo } from "@/components/brand/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "cn";

export function PublicHeader() {
  return (
    <header className="border-b border-border bg-surface shadow-public">
      <div aria-hidden="true" className="h-1 bg-indigo dark:bg-apricot" />
      <div className="relative mx-auto w-full max-w-6xl px-4 py-4 sm:px-6">
        <div className="flex flex-col items-center gap-3 md:flex-row md:flex-wrap md:justify-between md:gap-x-4 md:gap-y-3">
          <Link
            href="/"
            className="shrink-0 rounded-lg outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
          >
            <Logo alt="" className="w-28 md:w-40" />
            <span className="sr-only">DJEAZ, accueil</span>
          </Link>
          <div className="flex min-w-0 max-w-full flex-wrap items-center justify-center gap-2 md:justify-end md:gap-3">
            <nav aria-label="Compte" className="flex flex-nowrap items-center gap-2">
              <Link href="/sign-in" className={cn(buttonVariants({ variant: "outline" }))}>
                Connexion
              </Link>
              <Link href="/sign-up" className={cn(buttonVariants())}>
                Inscription
              </Link>
            </nav>
            {/* Hors flux sous `md` : le logo reste centré sur toute la largeur. */}
            <div className="absolute top-4 right-4 z-10 sm:right-6 md:static">
              <ThemeToggle />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
