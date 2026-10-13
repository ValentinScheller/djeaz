import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";

import { TooltipProvider } from "@/components/ui/tooltip";
import type { CatalogWorkspace } from "@/features/catalog/types";
import type { ActionResult } from "@/lib/action-result";

import { CatalogManager } from "./catalog-manager";

afterEach(() => {
  vi.unstubAllGlobals();
});

const COVER = "https://coverartarchive.org/release/bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb/front-250";

function workspace(): CatalogWorkspace {
  return {
    revision: 2,
    categories: [
      {
        id: "cat-1",
        name: "Cocktail",
        displayOrder: 0,
        tracks: [
          {
            associationId: "assoc-1",
            musicTrackId: "track-1",
            title: "Nuit Indigo",
            artist: "Nova",
            albumTitle: "Album clair",
            disambiguation: "live",
            artworkUrl: COVER,
            displayOrder: 0,
          },
          {
            associationId: "assoc-2",
            musicTrackId: "track-2",
            title: "Velours",
            artist: "Satellite",
            albumTitle: null,
            disambiguation: null,
            artworkUrl: null,
            displayOrder: 1,
          },
        ],
      },
      {
        id: "cat-2",
        name: "Dancefloor",
        displayOrder: 1,
        tracks: [],
      },
    ],
  };
}

function renderCatalog(current = workspace(), createMessage?: string) {
  const actions = {
    createCategory: vi.fn(async (): Promise<ActionResult<{ categoryId: string }>> =>
      createMessage
        ? {
            ok: false,
            error: {
              code: "VALIDATION_ERROR",
              message: createMessage,
              fieldErrors: { name: createMessage },
            },
          }
        : { ok: true, data: { categoryId: "cat-new" } },
    ),
    deleteCategory: vi.fn(async () => ({ ok: true as const, data: { changed: true } })),
    addLocal: vi.fn(async () => ({ ok: true as const, data: { associationId: "assoc-new" } })),
    addExternal: vi.fn(async () => ({ ok: true as const, data: { associationId: "assoc-ext" } })),
    remove: vi.fn(async () => ({ ok: true as const, data: { changed: true } })),
    move: vi.fn(async () => ({ ok: true as const, data: { changed: true } })),
    reorder: vi.fn(async () => ({ ok: true as const, data: { changed: true } })),
  };

  const view = render(
    <TooltipProvider>
      <CatalogManager workspace={current} actions={actions} />
    </TooltipProvider>,
  );

  return { ...view, actions };
}

test("ouvre la modale de catégorie, conserve la saisie en erreur et la vide après succès", async () => {
  const first = renderCatalog(workspace(), "Saisissez un nom de 1 à 80 caractères.");
  fireEvent.click(screen.getByRole("button", { name: "Créer une catégorie" }));

  const dialog = screen.getByRole("dialog", { name: "Créer une catégorie" });
  const input = screen.getByRole("textbox", { name: "Nom" });
  await waitFor(() => expect(input).toHaveFocus());
  fireEvent.change(input, { target: { value: "   " } });
  fireEvent.submit(dialog.querySelector("form") as HTMLFormElement);
  expect(await screen.findByRole("alert")).toHaveTextContent(
    "Saisissez un nom de 1 à 80 caractères.",
  );
  expect(input).toHaveValue("   ");
  expect(dialog).toBeInTheDocument();

  fireEvent.click(screen.getByRole("button", { name: "Annuler" }));
  await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  await waitFor(() =>
    expect(screen.getByRole("button", { name: "Créer une catégorie" })).toHaveFocus(),
  );

  first.unmount();
  const created = renderCatalog();
  fireEvent.click(screen.getByRole("button", { name: "Créer une catégorie" }));
  fireEvent.change(screen.getByRole("textbox", { name: "Nom" }), { target: { value: "Soirée" } });
  fireEvent.submit(screen.getByRole("dialog").querySelector("form") as HTMLFormElement);
  await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());

  created.rerender(
    <TooltipProvider>
      <CatalogManager
        workspace={{
          revision: 3,
          categories: [
            ...workspace().categories,
            { id: "cat-new", name: "Soirée", displayOrder: 2, tracks: [] },
          ],
        }}
        actions={created.actions}
      />
    </TooltipProvider>,
  );
  expect(screen.getByRole("tab", { name: "Soirée" })).toHaveAttribute("aria-selected", "true");

  fireEvent.click(screen.getByRole("button", { name: "Créer une catégorie" }));
  expect(screen.getByRole("textbox", { name: "Nom" })).toHaveValue("");
});

test("supprime la catégorie sélectionnée et choisit la suivante", async () => {
  const { actions } = renderCatalog();
  fireEvent.click(screen.getByRole("button", { name: "Supprimer la catégorie Cocktail" }));
  expect(
    screen.getByRole("alertdialog", { name: "Supprimer la catégorie « Cocktail » ?" }),
  ).toBeInTheDocument();
  expect(screen.getByText(/bibliothèque DJEAZ ne sont pas supprimés/)).toBeInTheDocument();

  fireEvent.click(screen.getByRole("button", { name: "Annuler" }));
  expect(screen.getByRole("tab", { name: "Cocktail" })).toHaveAttribute("aria-selected", "true");
  expect(actions.deleteCategory).not.toHaveBeenCalled();

  fireEvent.click(screen.getByRole("button", { name: "Supprimer la catégorie Cocktail" }));
  fireEvent.click(screen.getByRole("button", { name: "Supprimer" }));
  await waitFor(() => expect(actions.deleteCategory).toHaveBeenCalledWith("cat-1"));
  expect(screen.queryByRole("tab", { name: "Cocktail" })).not.toBeInTheDocument();
  expect(screen.getByRole("tab", { name: "Dancefloor" })).toHaveAttribute("aria-selected", "true");
});

test("la suppression de la dernière catégorie revient à l'état vide", async () => {
  const only = workspace();
  only.categories = [only.categories[0]!];
  renderCatalog(only);

  fireEvent.click(screen.getByRole("button", { name: "Supprimer la catégorie Cocktail" }));
  fireEvent.click(screen.getByRole("button", { name: "Supprimer" }));
  expect(
    await screen.findByRole("heading", { name: "Créer ma première catégorie" }),
  ).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Supprimer la catégorie" })).toBeDisabled();
  expect(screen.queryByRole("button", { name: "Ajouter un titre" })).not.toBeInTheDocument();
});

test("déplace un titre vers une autre catégorie et retire avec confirmation", async () => {
  const { actions } = renderCatalog();
  expect(screen.getByRole("button", { name: "Monter Nuit Indigo" })).toBeDisabled();
  expect(screen.getByRole("button", { name: "Descendre Velours" })).toBeDisabled();

  fireEvent.click(screen.getByRole("button", { name: "Déplacer Nuit Indigo" }));
  expect(screen.getByRole("menuitem", { name: "Dancefloor" })).toBeInTheDocument();
  expect(screen.queryByRole("menuitem", { name: "Cocktail" })).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("menuitem", { name: "Dancefloor" }));
  await waitFor(() => expect(actions.move).toHaveBeenCalledWith("assoc-1", "cat-2"));
  const remove = screen.getByRole("button", { name: "Retirer Velours" });
  await waitFor(() => expect(remove).toBeEnabled());

  fireEvent.click(remove);
  expect(
    screen.getByText(/Le morceau de la bibliothèque DJEAZ n'est pas supprimé/),
  ).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Retirer" }));
  await waitFor(() => expect(actions.remove).toHaveBeenCalledWith("assoc-2"));
});

test("une seule catégorie désactive le déplacement", () => {
  const only = workspace();
  only.categories = [only.categories[0]!];
  renderCatalog(only);
  expect(
    screen.getByRole("button", { name: "Déplacer Nuit Indigo, aucune autre catégorie" }),
  ).toBeDisabled();
});

test("la navigation clavier change de catégorie", () => {
  renderCatalog();
  const cocktail = screen.getByRole("tab", { name: "Cocktail" });
  cocktail.focus();
  fireEvent.keyDown(cocktail, { key: "ArrowRight" });
  expect(screen.getByRole("tab", { name: "Dancefloor" })).toHaveAttribute("aria-selected", "true");
  expect(screen.getByRole("tab", { name: "Dancefloor" })).toHaveFocus();
});

test("affiche la pochette ou le placeholder selon artworkUrl", () => {
  const { container } = renderCatalog();
  expect(container.querySelector(`img[src="${COVER}"]`)).toBeTruthy();
  const velvet = screen
    .getAllByRole("listitem")
    .find((item) => item.textContent?.includes("Velours"));
  expect(velvet?.querySelector("img")).toBeNull();
  expect(velvet?.querySelector("svg")).toBeTruthy();
});

test("la modale de titre se ferme et repart vide après un ajout", async () => {
  const fetchMock = vi.fn(async () => ({
    json: async () => ({
      ok: true,
      data: {
        results: [
          {
            id: "track-9",
            title: "Bohemian Rhapsody",
            artist: "Queen",
            albumTitle: null,
            artworkUrl: null,
          },
        ],
      },
    }),
  }));
  vi.stubGlobal("fetch", fetchMock);
  const { actions } = renderCatalog();

  fireEvent.click(screen.getByRole("button", { name: "Ajouter un titre" }));
  const dialog = screen.getByRole("dialog", { name: "Ajouter un titre" });
  const input = screen.getByLabelText("Rechercher un morceau");
  await waitFor(() => expect(input).toHaveFocus());
  fireEvent.change(input, { target: { value: "queen" } });
  expect(await screen.findByText("Bohemian Rhapsody")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Ajouter Bohemian Rhapsody" }));
  await waitFor(() => expect(actions.addLocal).toHaveBeenCalledWith("cat-1", "track-9"));
  await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());

  fireEvent.click(screen.getByRole("button", { name: "Ajouter un titre" }));
  expect(screen.getByLabelText("Rechercher un morceau")).toHaveValue("");
  expect(screen.queryByText("Bohemian Rhapsody")).not.toBeInTheDocument();
  expect(dialog).not.toBeInTheDocument();
});
