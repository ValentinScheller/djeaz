import type { Metadata } from "next";

import { requirePageSession } from "@/features/auth/session.server";

export const metadata: Metadata = {
  title: "Catalogue",
};

export default async function CatalogPage() {
  await requirePageSession("/catalog");

  return (
    <div className="flex flex-col gap-2">
      <h1 className="text-xl font-semibold">Catalogue</h1>
      <p className="max-w-prose text-text-secondary">
        Le catalogue sera disponible dans une prochaine étape.
      </p>
    </div>
  );
}
