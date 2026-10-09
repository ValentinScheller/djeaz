import {
  CircleCheckIcon,
  LibraryIcon,
  ListMusicIcon,
  MessageSquarePlusIcon,
  QrCodeIcon,
  type LucideIcon,
} from "lucide-react";

const steps: ReadonlyArray<{ text: string; icon: LucideIcon }> = [
  { text: "Ils ouvrent le lien ou scannent le QR code.", icon: QrCodeIcon },
  { text: "Ils parcourent les genres et les morceaux proposés.", icon: LibraryIcon },
  { text: "Ils sélectionnent ce qu'ils aimeraient entendre.", icon: ListMusicIcon },
  { text: "Ils peuvent ajouter une ou plusieurs envies libres.", icon: MessageSquarePlusIcon },
  { text: "Ils valident leur réponse.", icon: CircleCheckIcon },
];

export function GuestExperience() {
  return (
    <section
      aria-labelledby="guest-experience"
      className="bg-apricot px-4 py-14 text-charcoal sm:px-6 sm:py-20"
    >
      <div className="mx-auto grid w-full max-w-6xl min-w-0 gap-8 lg:grid-cols-2 lg:items-start lg:gap-16">
        <div className="max-w-xl">
          <h2
            id="guest-experience"
            className="mt-4 text-balance text-3xl font-bold tracking-tight sm:text-4xl"
          >
            Un sondage auquel les invités ont vraiment envie de répondre.
          </h2>
          <p className="mt-3 max-w-prose text-pretty">
            Pas de formulaire interminable : ils parcourent la musique, sélectionnent leurs coups de cœur
            et peuvent ajouter leurs propres envies.
          </p>
          <p className="mt-3 max-w-prose text-pretty">
            C’est tout ce qu’il faut pour participer.
          </p>
          <p className="mt-3 max-w-prose text-pretty">
            Aucune inscription et aucune application à installer.
          </p>
        </div>
        <ol className="grid min-w-0 list-none gap-3">
          {steps.map((step) => (
            <li
              key={step.text}
              className="flex min-w-0 items-start gap-4 rounded-xl bg-ivory px-4 py-4 text-charcoal shadow-public"
            >
              <span
                aria-hidden="true"
                className="grid size-11 shrink-0 place-items-center rounded-xl bg-indigo text-ivory"
              >
                <step.icon className="size-5" />
              </span>
              <p className="min-w-0 self-center text-pretty">{step.text}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
