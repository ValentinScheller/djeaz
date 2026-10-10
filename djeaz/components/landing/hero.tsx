import {
  Disc3Icon,
  Music2Icon,
  QrCodeIcon,
  SlidersHorizontalIcon,
  UserRoundXIcon,
  type LucideIcon,
} from "lucide-react";
import type { CSSProperties } from "react";

import { AnimatedMascot } from "@/components/brand/animated-mascot";

const benefits: ReadonlyArray<{
  label: string;
  icon: LucideIcon;
  duration: number;
  delay: number;
  shift: number;
}> = [
  { label: "Sans compte invité", icon: UserRoundXIcon, duration: 5.4, delay: -0.4, shift: -6 },
  { label: "Lien + QR code", icon: QrCodeIcon, duration: 4.7, delay: -2.5, shift: 7 },
  {
    label: "Le DJ maîtrise à 100%",
    icon: SlidersHorizontalIcon,
    duration: 5.8,
    delay: -1.2,
    shift: -4,
  },
];

const benefitCardClassName = [
  "flex h-full min-w-0 flex-col items-center justify-start gap-3 rounded-[1.25rem] border border-indigo/20 px-2 py-4 text-center sm:px-3 sm:py-5",
  "bg-[color-mix(in_srgb,var(--djeaz-apricot)_24%,var(--djeaz-surface))]",
  "text-sm font-medium text-text",
  "shadow-[inset_0_1px_0_rgb(255_255_255/0.55),0_8px_18px_-14px_rgb(37_38_49/0.45)]",
  "dark:border-ivory/15",
  "dark:shadow-[inset_0_1px_0_rgb(255_255_255/0.14),0_8px_18px_-14px_rgb(0_0_0/0.55)]",
  "motion-safe:animate-landing-benefit",
].join(" ");

export function LandingHero() {
  return (
    <section
      aria-labelledby="landing-promise"
      className="px-4 pt-12 pb-8 sm:px-6 sm:pt-16 lg:pt-24 lg:pb-12"
    >
      <div className="mx-auto grid w-full max-w-6xl items-start gap-8 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)] lg:gap-12">
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
          <ul className="mt-8 grid w-full min-w-0 list-none grid-cols-3 items-stretch gap-2 sm:gap-4 lg:gap-6">
            {benefits.map((benefit) => (
              <li
                key={benefit.label}
                className={benefitCardClassName}
                style={
                  {
                    animationDuration: `${benefit.duration}s`,
                    animationDelay: `${benefit.delay}s`,
                    "--benefit-shift": `${benefit.shift}px`,
                  } as CSSProperties
                }
              >
                <span
                  aria-hidden="true"
                  className="grid size-11 shrink-0 place-items-center rounded-full bg-apricot text-charcoal sm:size-14"
                >
                  <benefit.icon className="size-5 sm:size-6" strokeWidth={2.25} />
                </span>
                <span className="max-w-full text-balance">{benefit.label}</span>
              </li>
            ))}
          </ul>
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
