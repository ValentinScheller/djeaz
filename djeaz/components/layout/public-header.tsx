import Link from "next/link";

import { Logo } from "@/components/brand/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "cn";

export function PublicHeader() {
  return (
    <header className="border-b border-border bg-surface shadow-public">
      <div aria-hidden="true" className="h-1 bg-indigo dark:bg-apricot" />
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-x-4 gap-y-3 px-4 py-4 sm:px-6">
        <Link
          href="/"
          className="shrink-0 rounded-lg outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
        >
          <Logo alt="" className="w-28 sm:w-40" />
          <span className="sr-only">DJEAZ, accueil</span>
        </Link>
        <div className="flex min-w-0 max-w-full flex-wrap items-center justify-end gap-3">
          <nav aria-label="Compte" className="flex flex-wrap items-center gap-2">
            <Link href="/sign-in" className={cn(buttonVariants({ variant: "outline" }))}>
              Connexion
            </Link>
            <Link href="/sign-up" className={cn(buttonVariants())}>
              Inscription
            </Link>
          </nav>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
