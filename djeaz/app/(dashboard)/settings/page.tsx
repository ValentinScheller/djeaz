import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Paramètres",
};

export default function SettingsPage() {
  return (
    <div className="flex flex-col gap-2">
      <h1 className="text-xl font-semibold">Paramètres</h1>
      <p className="max-w-prose text-text-secondary">
        Les paramètres seront disponibles dans une prochaine étape.
      </p>
    </div>
  );
}
