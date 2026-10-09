import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "cn";

export function FinalCta() {
  return (
    <section
      aria-labelledby="final-cta"
      className="bg-indigo px-4 py-14 text-ivory sm:px-6 sm:py-20"
    >
      <div className="mx-auto flex w-full max-w-3xl min-w-0 flex-col items-center gap-6 text-center">
        <h2 id="final-cta" className="text-balance text-3xl font-bold tracking-tight sm:text-4xl">
          Votre prochaine soirée commence ici !
        </h2>
        <p className="max-w-prose text-pretty">
          Créez votre espace DJ et découvrez ce que votre prochain public a envie d’entendre.
        </p>
        <div className="flex w-full max-w-md flex-col gap-3 sm:max-w-none sm:flex-row sm:justify-center">
          <Link
            href="/sign-up"
            className={cn(
              buttonVariants({ size: "lg" }),
              "w-full whitespace-normal bg-apricot text-charcoal hover:bg-apricot/90 focus-visible:outline-ivory active:bg-apricot/80 sm:w-auto",
            )}
          >
            Je me lance !
          </Link>
          <Link
            href="/sign-in"
            className={cn(
              buttonVariants({ variant: "outline", size: "lg" }),
              "w-full whitespace-normal border-ivory bg-transparent text-ivory hover:bg-ivory/15 focus-visible:outline-ivory active:bg-ivory/25 sm:w-auto",
            )}
          >
            J&apos;ai déjà un compte
          </Link>
        </div>
      </div>
    </section>
  );
}
