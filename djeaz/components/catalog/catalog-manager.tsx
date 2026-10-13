"use client";

import {
  ArrowRightLeftIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  PlusIcon,
  Trash2Icon,
} from "lucide-react";
import { useRef, useState, useTransition, type KeyboardEvent, type RefObject } from "react";

import { CatalogSearch } from "@/components/catalog/catalog-search";
import { TrackArtwork } from "@/components/catalog/track-artwork";
import { EmptyState } from "@/components/states/empty-state";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { IconActionButton } from "@/components/ui/icon-action-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import type { CatalogCategoryView, CatalogWorkspace } from "@/features/catalog/types";
import type { ActionResult } from "@/lib/action-result";

type CatalogActions = {
  createCategory: (name: string) => Promise<ActionResult<{ categoryId: string }>>;
  deleteCategory: (categoryId: string) => Promise<ActionResult<{ changed: boolean }>>;
  addLocal: (
    categoryId: string,
    musicTrackId: string,
  ) => Promise<ActionResult<{ associationId: string }>>;
  addExternal: (
    categoryId: string,
    externalId: string,
  ) => Promise<ActionResult<{ associationId: string }>>;
  remove: (associationId: string) => Promise<ActionResult<{ changed: boolean }>>;
  move: (
    associationId: string,
    targetCategoryId: string,
  ) => Promise<ActionResult<{ changed: boolean }>>;
  reorder: (
    associationId: string,
    direction: "up" | "down",
  ) => Promise<ActionResult<{ changed: boolean }>>;
};

function failureMessage(result: ActionResult<unknown>, fallback: string): string | null {
  return result.ok ? null : result.error.fieldErrors?.name || result.error.message || fallback;
}

function categoryIdAfterRemoval(categories: CatalogCategoryView[], removedId: string): string {
  const index = categories.findIndex((category) => category.id === removedId);
  const remaining = categories.filter((category) => category.id !== removedId);
  if (remaining.length === 0 || index < 0) {
    return "";
  }

  return remaining[index]?.id ?? remaining[index - 1]?.id ?? remaining[0]?.id ?? "";
}

function CategoryCreateDialog({
  open,
  onOpenChange,
  onCreate,
  onCreated,
  finalFocus,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: CatalogActions["createCategory"];
  onCreated: (categoryId: string) => void;
  finalFocus: RefObject<HTMLButtonElement | null>;
}) {
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        initialFocus={inputRef}
        finalFocus={finalFocus as RefObject<HTMLElement | null>}
        showCloseButton
      >
        <DialogHeader>
          <DialogTitle>Créer une catégorie</DialogTitle>
        </DialogHeader>
        <form
          className="flex flex-col gap-3"
          onSubmit={(event) => {
            event.preventDefault();
            const submitted = name;
            setError(null);
            startTransition(async () => {
              const result = await onCreate(submitted);
              const message = failureMessage(result, "La catégorie n'a pas été créée.");
              if (message) {
                setError(message);
                return;
              }
              if (!result.ok) {
                return;
              }
              setName("");
              setError(null);
              onCreated(result.data.categoryId);
              onOpenChange(false);
            });
          }}
        >
          <div className="flex flex-col gap-2">
            <Label htmlFor="catalog-category-name">Nom</Label>
            <Input
              ref={inputRef}
              id="catalog-category-name"
              name="name"
              value={name}
              maxLength={80}
              required
              autoComplete="off"
              onChange={(event) => setName(event.target.value)}
            />
          </div>
          {error ? (
            <p role="alert" className="text-sm font-medium text-error wrap-break-word">
              {error}
            </p>
          ) : null}
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              disabled={pending}
              onClick={() => onOpenChange(false)}
            >
              Annuler
            </Button>
            <Button type="submit" loading={pending} disabled={pending}>
              Créer
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function CatalogManager({
  workspace,
  actions,
}: {
  workspace: CatalogWorkspace;
  actions: CatalogActions;
}) {
  const [selectedId, setSelectedId] = useState(workspace.categories[0]?.id ?? "");
  const [hiddenCategoryId, setHiddenCategoryId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [createOpen, setCreateOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [removeTargetId, setRemoveTargetId] = useState<string | null>(null);
  const [removeError, setRemoveError] = useState<string | null>(null);
  const createButtonRef = useRef<HTMLButtonElement>(null);
  const addTrackButtonRef = useRef<HTMLButtonElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const visibleCategories = workspace.categories.filter(
    (category) => category.id !== hiddenCategoryId,
  );
  const active =
    visibleCategories.find((category) => category.id === selectedId) ?? visibleCategories[0];
  const removeTarget =
    active?.tracks.find((track) => track.associationId === removeTargetId) ?? null;

  function mutate(operation: () => Promise<ActionResult<unknown>>) {
    setError(null);
    startTransition(async () => {
      const result = await operation();
      const message = failureMessage(result, "L'opération a échoué.");
      if (message) {
        setError(message);
      }
    });
  }

  function onCategoryKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (!active) {
      return;
    }

    const current = visibleCategories.findIndex((category) => category.id === active.id);
    let next = current;
    if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      next = (current + 1) % visibleCategories.length;
    } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      next = (current - 1 + visibleCategories.length) % visibleCategories.length;
    } else if (event.key === "Home") {
      next = 0;
    } else if (event.key === "End") {
      next = visibleCategories.length - 1;
    } else {
      return;
    }

    event.preventDefault();
    const category = visibleCategories[next];
    if (!category) {
      return;
    }
    setSelectedId(category.id);
    document.getElementById(`catalog-category-${category.id}`)?.focus();
  }

  function confirmDeleteCategory() {
    if (!active) {
      return;
    }

    const removedId = active.id;
    const nextId = categoryIdAfterRemoval(visibleCategories, removedId);
    setDeleteError(null);
    startTransition(async () => {
      const result = await actions.deleteCategory(removedId);
      const message = failureMessage(result, "La catégorie n'a pas été supprimée.");
      if (message) {
        setDeleteError(message);
        return;
      }
      setHiddenCategoryId(removedId);
      setSelectedId(nextId);
      setDeleteOpen(false);
    });
  }

  function confirmRemoveTrack() {
    if (!removeTarget) {
      return;
    }

    const associationId = removeTarget.associationId;
    setRemoveError(null);
    startTransition(async () => {
      const result = await actions.remove(associationId);
      const message = failureMessage(result, "Le titre n'a pas été retiré.");
      if (message) {
        setRemoveError(message);
        return;
      }
      setRemoveTargetId(null);
    });
  }

  return (
    <div className="flex min-w-0 flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl font-semibold">Catégories</h1>
        <div className="flex shrink-0 items-center gap-2">
          <IconActionButton
            ref={createButtonRef}
            label="Créer une catégorie"
            tooltip="Créer une catégorie"
            icon={PlusIcon}
            onClick={() => setCreateOpen(true)}
          />
          <IconActionButton
            label={active ? `Supprimer la catégorie ${active.name}` : "Supprimer la catégorie"}
            tooltip={active ? "Supprimer la catégorie" : "Aucune catégorie à supprimer"}
            icon={Trash2Icon}
            variant="destructive"
            disabled={!active || pending}
            onClick={() => {
              setDeleteError(null);
              setDeleteOpen(true);
            }}
          />
        </div>
      </div>

      {active ? (
        <>
          <div
            role="tablist"
            aria-label="Catégories"
            className="flex flex-wrap gap-2"
            onKeyDown={onCategoryKeyDown}
          >
            {visibleCategories.map((category) => {
              const selected = category.id === active.id;
              return (
                <Button
                  key={category.id}
                  id={`catalog-category-${category.id}`}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  tabIndex={selected ? 0 : -1}
                  variant={selected ? "default" : "outline"}
                  className="h-auto max-w-full min-w-0 whitespace-normal px-3 text-left"
                  onClick={() => setSelectedId(category.id)}
                >
                  <span className="wrap-break-word">{category.name}</span>
                </Button>
              );
            })}
          </div>

          <Separator />

          <section className="flex min-w-0 flex-col gap-3" aria-labelledby="catalog-tracks-heading">
            <div className="flex items-center justify-between gap-3">
              <h2 id="catalog-tracks-heading" className="text-xl font-semibold">
                Titres
              </h2>
              <IconActionButton
                ref={addTrackButtonRef}
                label="Ajouter un titre"
                tooltip="Ajouter un titre"
                icon={PlusIcon}
                disabled={pending}
                onClick={() => setSearchOpen(true)}
              />
            </div>
            {error ? (
              <p role="alert" className="text-sm font-medium text-error wrap-break-word">
                {error}
              </p>
            ) : null}
            {active.tracks.length === 0 ? (
              <p className="text-text-secondary">Cette catégorie ne contient aucun morceau.</p>
            ) : (
              <ul className="flex min-w-0 flex-col gap-2">
                {active.tracks.map((track, index) => {
                  const targets = visibleCategories.filter((category) => category.id !== active.id);
                  const moveDisabled = pending || targets.length === 0;
                  return (
                    <li
                      key={track.associationId}
                      className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-2 rounded-xl border border-border bg-card px-3 py-2"
                    >
                      <div className="flex min-w-0 flex-1 basis-40 items-center gap-3">
                        <TrackArtwork url={track.artworkUrl} />
                        <div className="min-w-0">
                          <p className="font-medium leading-tight wrap-break-word">{track.title}</p>
                          <p className="text-sm leading-tight text-text-secondary wrap-break-word">
                            {track.artist}
                          </p>
                          {track.albumTitle ? (
                            <p className="text-sm leading-tight text-text-secondary wrap-break-word">
                              {track.albumTitle}
                            </p>
                          ) : null}
                          {track.disambiguation ? (
                            <p className="text-sm leading-tight text-text-secondary wrap-break-word">
                              {track.disambiguation}
                            </p>
                          ) : null}
                        </div>
                      </div>
                      <div className="ms-auto flex shrink-0 items-center gap-1">
                        <IconActionButton
                          size="icon-sm"
                          label={`Monter ${track.title}`}
                          tooltip="Monter"
                          icon={ChevronUpIcon}
                          disabled={pending || index === 0}
                          onClick={() => mutate(() => actions.reorder(track.associationId, "up"))}
                        />
                        <IconActionButton
                          size="icon-sm"
                          label={`Descendre ${track.title}`}
                          tooltip="Descendre"
                          icon={ChevronDownIcon}
                          disabled={pending || index === active.tracks.length - 1}
                          onClick={() => mutate(() => actions.reorder(track.associationId, "down"))}
                        />
                        <DropdownMenu>
                          <DropdownMenuTrigger
                            disabled={moveDisabled}
                            render={(props) => (
                              <IconActionButton
                                {...props}
                                size="icon-sm"
                                label={
                                  targets.length === 0
                                    ? `Déplacer ${track.title}, aucune autre catégorie`
                                    : `Déplacer ${track.title}`
                                }
                                tooltip={
                                  targets.length === 0 ? "Aucune autre catégorie" : "Déplacer"
                                }
                                icon={ArrowRightLeftIcon}
                                disabled={moveDisabled}
                              />
                            )}
                          />
                          <DropdownMenuContent
                            align="end"
                            className="w-56 max-w-[calc(100vw-2rem)]"
                          >
                            <DropdownMenuGroup>
                              <DropdownMenuLabel>Déplacer vers</DropdownMenuLabel>
                              {targets.map((category) => (
                                <DropdownMenuItem
                                  key={category.id}
                                  className="h-auto whitespace-normal"
                                  disabled={pending}
                                  onClick={() =>
                                    mutate(() => actions.move(track.associationId, category.id))
                                  }
                                >
                                  <span className="wrap-break-word">{category.name}</span>
                                </DropdownMenuItem>
                              ))}
                            </DropdownMenuGroup>
                          </DropdownMenuContent>
                        </DropdownMenu>
                        <IconActionButton
                          size="icon-sm"
                          label={`Retirer ${track.title}`}
                          tooltip="Retirer"
                          icon={Trash2Icon}
                          variant="destructive"
                          disabled={pending}
                          onClick={() => {
                            setRemoveError(null);
                            setRemoveTargetId(track.associationId);
                          }}
                        />
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </>
      ) : (
        <EmptyState
          title="Créer ma première catégorie"
          description="Votre catalogue est vide. Préparez votre catalogue pour classer les morceaux que vous proposerez."
        />
      )}

      <CategoryCreateDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreate={actions.createCategory}
        onCreated={setSelectedId}
        finalFocus={createButtonRef}
      />

      <Dialog open={searchOpen} onOpenChange={setSearchOpen}>
        <DialogContent
          initialFocus={searchInputRef}
          finalFocus={addTrackButtonRef as RefObject<HTMLElement | null>}
          className="max-h-[min(40rem,calc(100dvh-2rem))] overflow-y-auto sm:max-w-lg"
        >
          <DialogHeader>
            <DialogTitle>Ajouter un titre</DialogTitle>
            <DialogDescription className="sr-only">
              Recherchez un morceau dans DJEAZ ou plus largement, puis ajoutez-le à la catégorie
              sélectionnée.
            </DialogDescription>
          </DialogHeader>
          {active ? (
            <CatalogSearch
              categoryId={active.id}
              disabled={pending}
              inputRef={searchInputRef}
              onAdded={() => setSearchOpen(false)}
              onAddLocal={(musicTrackId) => actions.addLocal(active.id, musicTrackId)}
              onAddExternal={(externalId) => actions.addExternal(active.id, externalId)}
            />
          ) : null}
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={deleteOpen && active != null}
        onOpenChange={(open) => {
          setDeleteOpen(open);
          if (!open) {
            setDeleteError(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="wrap-break-word">
              Supprimer la catégorie « {active?.name} » ?
            </AlertDialogTitle>
            <AlertDialogDescription className="wrap-break-word">
              Les titres de cette catégorie seront retirés de votre catalogue. Les morceaux de la
              bibliothèque DJEAZ ne sont pas supprimés. Cette action est définitive.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {deleteError ? (
            <p role="alert" className="text-sm font-medium text-error wrap-break-word">
              {deleteError}
            </p>
          ) : null}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={pending}
              loading={pending}
              onClick={confirmDeleteCategory}
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={removeTarget != null}
        onOpenChange={(open) => {
          if (!open) {
            setRemoveTargetId(null);
            setRemoveError(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="wrap-break-word">
              Retirer « {removeTarget?.title} » ?
            </AlertDialogTitle>
            <AlertDialogDescription className="wrap-break-word">
              Ce titre sera retiré de votre catalogue. Le morceau de la bibliothèque DJEAZ
              n&apos;est pas supprimé.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {removeError ? (
            <p role="alert" className="text-sm font-medium text-error wrap-break-word">
              {removeError}
            </p>
          ) : null}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={pending}
              loading={pending}
              onClick={confirmRemoveTrack}
            >
              Retirer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
