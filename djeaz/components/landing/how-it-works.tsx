import { CalendarPlusIcon, ChartColumnIcon, QrCodeIcon, type LucideIcon } from "lucide-react";

import { Card, CardContent, CardHeader } from "@/components/ui/card";

const steps: ReadonlyArray<{
  title: string;
  description: string;
  icon: LucideIcon;
}> = [
  {
    title: "Créez votre événement",
    description: "Le DJ prépare une prestation dans son espace.",
    icon: CalendarPlusIcon,
  },
  {
    title: "Partagez le sondage",
    description: "DJEAZ fournit un lien et un QR code à transmettre aux invités.",
    icon: QrCodeIcon,
  },
  {
    title: "Découvrez les tendances",
    description: "Les réponses donnent une vision claire des goûts du public pour préparer le set.",
    icon: ChartColumnIcon,
  },
];

export function HowItWorks() {
  return (
    <section aria-labelledby="how-it-works" className="px-4 py-14 sm:px-6 sm:py-20">
      <div className="mx-auto flex w-full max-w-6xl min-w-0 flex-col gap-8 sm:gap-10">
        <div className="max-w-2xl">
          <h2
            id="how-it-works"
            className="text-balance text-3xl font-bold tracking-tight sm:text-4xl"
          >
            Comment ça marche ?
          </h2>
          <p className="mt-3 max-w-prose text-pretty text-text-secondary">
            Créez votre événement une fois, partagez-le et laissez DJEAZ faire remonter les
            tendances avant le jour J.
          </p>
        </div>
        <ol className="grid min-w-0 list-none gap-4 md:grid-cols-3 md:gap-6">
          {steps.map((step, index) => (
            <li key={step.title} className="min-w-0">
              <Card className="h-full">
                <CardHeader>
                  <span
                    aria-hidden="true"
                    className="mb-3 grid size-11 place-items-center rounded-xl bg-indigo text-ivory"
                  >
                    <step.icon className="size-5" />
                  </span>
                  <p className="text-sm font-semibold text-text-secondary">Étape {index + 1}</p>
                  <h3 className="text-lg leading-snug font-semibold">{step.title}</h3>
                </CardHeader>
                <CardContent>
                  <p className="text-pretty text-text-secondary">{step.description}</p>
                </CardContent>
              </Card>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
