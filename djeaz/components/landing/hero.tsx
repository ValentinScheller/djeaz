import { Disc3Icon, Music2Icon } from "lucide-react";

import { AnimatedMascot } from "@/components/brand/animated-mascot";

export function LandingHero() {
  return (
    <section
      aria-labelledby="landing-promise"
      className="px-4 pt-12 pb-4 sm:px-6 sm:pt-16 lg:pt-24 lg:pb-6"
    >
      <div className="mx-auto grid w-full max-w-6xl items-center gap-8 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)] lg:gap-12">
        <div className="flex min-w-0 flex-col items-center gap-5 text-center lg:items-start lg:text-left">
          <p className="rounded-pill bg-apricot px-4 py-1.5 text-sm font-semibold text-charcoal">
            Pour les DJs événementiels
          </p>
          <h1
            id="landing-promise"
            className="text-[clamp(1.4rem,0.55rem+3.4vw,2.75rem)] leading-[1.15] font-bold tracking-tight"
          >
            <span className="block">Votre set commence bien</span>{" "}
            <span className="block">avant le premier morceau.</span>
          </h1>
          <p className="max-w-prose text-pretty text-text-secondary">
            Recueillez les goûts de vos invités en amont et préparez votre soirée avec autre chose
            que des suppositions.
          </p>
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
