import {
  ListMusicIcon,
  MessageSquareTextIcon,
  MusicIcon,
  UsersIcon,
  type LucideIcon,
} from "lucide-react";

const points: ReadonlyArray<{ label: string; icon: LucideIcon }> = [
  { label: "Mieux connaître son public avant l'événement", icon: UsersIcon },
  { label: "Repérer les morceaux et les genres populaires", icon: MusicIcon },
  { label: "Retrouver les demandes particulières", icon: MessageSquareTextIcon },
  { label: "Préparer son set avec davantage de contexte", icon: ListMusicIcon },
];

export function DjValue() {
  return (
    <section aria-labelledby="dj-value" className="px-4 py-14 sm:px-6 sm:py-20">
      <div className="mx-auto flex w-full max-w-7xl min-w-0 flex-col gap-8">
        <div>
          <h2 id="dj-value" className="text-balance text-3xl font-bold tracking-tight sm:text-4xl">
            Des indices pour préparer votre set. Votre feeling fait le reste.
          </h2>
          <p className="mt-3 text-pretty text-text-secondary">
            <span className="xl:block">
              Genres populaires, morceaux qui reviennent, demandes particulières : DJEAZ fait
              ressortir les goûts et les tendances du public.
            </span>{" "}
            <span className="xl:block">
              Vous gardez toute la liberté de construire votre set, votre progression et votre
              ambiance.
            </span>
          </p>
        </div>
        <ul className="grid min-w-0 list-none gap-4 sm:grid-cols-2">
          {points.map((point) => (
            <li
              key={point.label}
              className="flex min-w-0 items-start gap-4 rounded-xl border border-border bg-surface p-4 shadow-raised"
            >
              <span
                aria-hidden="true"
                className="grid size-11 shrink-0 place-items-center rounded-xl bg-apricot text-charcoal"
              >
                <point.icon className="size-5" />
              </span>
              <p className="min-w-0 self-center font-medium text-pretty">{point.label}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
