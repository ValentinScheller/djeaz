import { Logo } from "@/components/brand/logo";

export function PublicFooter() {
  return (
    <footer className="mt-auto border-t border-border bg-surface">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-4 py-8 sm:px-6">
        <Logo alt="" className="w-28" />
        <p className="max-w-prose text-text-secondary">
          DJEAZ recueille les préférences musicales des invités pour préparer un événement.
        </p>
      </div>
    </footer>
  );
}
