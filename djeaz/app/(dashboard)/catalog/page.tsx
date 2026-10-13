import type { Metadata } from "next";

import { CatalogManager } from "@/components/catalog/catalog-manager";
import {
  addExternalTrackAction,
  addLocalTrackAction,
  createCategoryAction,
  deleteCategoryAction,
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
    <CatalogManager
      workspace={workspace}
      actions={{
        createCategory: createCategoryAction,
        deleteCategory: deleteCategoryAction,
        addLocal: addLocalTrackAction,
        addExternal: addExternalTrackAction,
        remove: removeCatalogTrackAction,
        move: moveCatalogTrackAction,
        reorder: reorderCatalogTrackAction,
      }}
    />
  );
}
