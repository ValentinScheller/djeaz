import { Disc3Icon, Music2Icon } from "lucide-react";
import Link from "next/link";

import { AnimatedMascot } from "@/components/brand/animated-mascot";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "cn";

export function LandingHero() {
  return (
    <section aria-labelledby="landing-promise" className="px-4 py-12 sm:px-6 sm:py-16 lg:py-24">
      <div className="mx-auto grid w-full max-w-6xl items-center gap-10 lg:grid-cols-2 lg:gap-16">
        <div className="flex min-w-0 flex-col items-center gap-6 text-center lg:items-start lg:text-left">
          <p className="rounded-pill bg-apricot px-4 py-1.5 text-sm font-semibold text-charcoal">
            Pour les DJs événementiels
          </p>
          <h1
            id="landing-promise"
            className="max-w-3xl text-balance text-[clamp(1.875rem,1.2rem+2.4vw,3.5rem)] leading-[1.15] font-bold tracking-tight"
          >
            Votre set commence bien avant le premier morceau.
          </h1>
          <p className="max-w-prose text-pretty text-text-secondary">
            Recueillez les goûts de vos invités en amont et préparez votre soirée avec autre chose que des suppositions.
          </p>
          <div className="flex w-full max-w-md flex-col gap-3 sm:max-w-none sm:flex-row sm:justify-center lg:justify-start">
            <Link
              href="/sign-up"
              className={cn(buttonVariants({ size: "lg" }), "w-full whitespace-normal sm:w-auto")}
            >
              Créer mon espace DJ
            </Link>
            <Link
              href="/sign-in"
              className={cn(
                buttonVariants({ variant: "outline", size: "lg" }),
                "w-full whitespace-normal sm:w-auto",
              )}
            >
              Se connecter
            </Link>
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-56 min-w-0 sm:max-w-72 lg:max-w-96">
          <Music2Icon
            aria-hidden="true"
            className="pointer-events-none absolute top-0 left-0 size-6 text-indigo sm:size-8 dark:text-apricot"
          />
          <Disc3Icon
            aria-hidden="true"
            className="pointer-events-none absolute right-0 bottom-2 size-6 text-indigo sm:size-8 dark:text-apricot"
          />
          <div className="px-5 sm:px-6">
            <div className="relative">
              <div aria-hidden="true" className="absolute inset-[8%] rounded-full bg-indigo" />
              <AnimatedMascot variant="floaty" className="relative w-full" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
