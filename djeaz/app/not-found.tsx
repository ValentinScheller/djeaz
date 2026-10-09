import type { Metadata } from "next";
import Link from "next/link";

import { AnimatedMascot } from "@/components/brand/animated-mascot";
import { PublicShell } from "@/components/layout/public-shell";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "cn";

export const metadata: Metadata = {
  title: "Page introuvable",
};

export default function NotFound() {
  return (
    <PublicShell>
      <main className="mx-auto flex w-full min-w-0 max-w-3xl flex-1 flex-col items-center justify-center gap-6 px-4 py-12 text-center sm:px-6">
        <AnimatedMascot
          variant="explode"
          className="w-52 sm:w-64"
          startDelay={1000}
          endDelay={200}
        />
        <div className="flex w-full min-w-0 max-w-xl flex-col items-center gap-3">
          <p className="text-5xl font-bold tracking-tight text-action sm:text-6xl">404</p>
          <h1 className="text-2xl font-semibold text-balance wrap-break-word">
            Cette page est introuvable.
          </h1>
          <p className="max-w-prose text-pretty text-text-secondary wrap-break-word">
            Le lien est peut-être ancien, ou l&apos;adresse contient une erreur.
          </p>
        </div>
        <Link href="/" className={cn(buttonVariants({ size: "lg" }), "max-w-full")}>
          Retour à l&apos;accueil
        </Link>
      </main>
    </PublicShell>
  );
}
