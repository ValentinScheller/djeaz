import type { Metadata } from "next";

import { CatalogManager } from "@/components/catalog/catalog-manager";
import {
  addExternalTrackAction,
  addLocalTrackAction,
  createCategoryAction,
  moveCatalogTrackAction,
  removeCatalogTrackAction,
  reorderCatalogTrackAction,
} from "@/features/catalog/actions";
import { requirePageSession } from "@/features/auth/session.server";

export const metadata: Metadata = {
  title: "Catalogue",
};

export default async function CatalogPage() {
  const session = await requirePageSession("/catalog");
  // Import différé : charger la page pendant `next build` ne doit pas ouvrir la base.
  const { loadCatalogWorkspace } = await import("@/features/catalog/view.server");
  const workspace = await loadCatalogWorkspace(session.user.id);

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold">Catalogue</h1>
      <CatalogManager
        workspace={workspace}
        actions={{
          createCategory: createCategoryAction,
          addLocal: addLocalTrackAction,
          addExternal: addExternalTrackAction,
          remove: removeCatalogTrackAction,
          move: moveCatalogTrackAction,
          reorder: reorderCatalogTrackAction,
        }}
      />
    </div>
  );
}
