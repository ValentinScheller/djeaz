import { DjValue } from "@/components/landing/dj-value";
import { FinalCta } from "@/components/landing/final-cta";
import { GuestExperience } from "@/components/landing/guest-experience";
import { LandingHero } from "@/components/landing/hero";
import { HowItWorks } from "@/components/landing/how-it-works";
import { ScrollCue } from "@/components/landing/scroll-cue";

export default function Home() {
  return (
    <main className="flex w-full min-w-0 flex-1 flex-col">
      <LandingHero />
      <ScrollCue />
      <HowItWorks />
      <GuestExperience />
      <DjValue />
      <FinalCta />
    </main>
  );
}
