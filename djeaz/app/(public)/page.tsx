import { DjValue } from "@/components/landing/dj-value";
import { FinalCta } from "@/components/landing/final-cta";
import { GuestExperience } from "@/components/landing/guest-experience";
import { LandingHero } from "@/components/landing/hero";
import { HowItWorks } from "@/components/landing/how-it-works";

export default function Home() {
  return (
    <main className="flex w-full min-w-0 flex-1 flex-col">
      <LandingHero />
      <HowItWorks />
      <GuestExperience />
      <DjValue />
      <FinalCta />
    </main>
  );
}
