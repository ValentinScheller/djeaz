import type { Metadata } from "next";

import { EmptyState } from "@/components/states/empty-state";
import { requirePageSession } from "@/features/auth/session.server";

export const metadata: Metadata = {
  title: "Catalogue",
};

export default async function CatalogPage() {
  await requirePageSession("/catalog");

  return (
    <div className="flex flex-col gap-2">
      <h1 className="text-xl font-semibold">Catalogue</h1>
      <EmptyState
        title="Créer ma première catégorie"
        description="Votre catalogue est vide. Préparez votre catalogue pour classer les morceaux que vous proposerez."
      />
    </div>
  );
}
