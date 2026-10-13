"use client";

import { useState, useTransition } from "react";

import { CatalogSearch } from "@/components/catalog/catalog-search";
import { TrackArtwork } from "@/components/catalog/track-artwork";
import { EmptyState } from "@/components/states/empty-state";
import { Button } from "@/components/ui/button";
import { fieldClassName } from "@/components/ui/input";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { CatalogWorkspace } from "@/features/catalog/types";
import type { ActionResult } from "@/lib/action-result";

type CatalogActions = {
  createCategory: (name: string) => Promise<ActionResult<{ categoryId: string }>>;
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

function CategoryForm({
  onCreate,
  legend,
}: {
  onCreate: CatalogActions["createCategory"];
  legend: string;
}) {
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <form
      className="flex w-full min-w-0 flex-col gap-3"
      onSubmit={(event) => {
        event.preventDefault();
        const submitted = name;
        startTransition(async () => {
          const result = await onCreate(submitted);
          const message = failureMessage(result, "La catégorie n'a pas été créée.");
          if (message) {
            setError(message);
            return;
          }
          setName("");
          setError(null);
        });
      }}
    >
      <div className="flex flex-col gap-2 text-left">
        <Label htmlFor="category-name">{legend}</Label>
        <Input
          id="category-name"
          name="name"
          value={name}
          maxLength={80}
          required
          onChange={(event) => setName(event.target.value)}
        />
      </div>
      {error ? (
        <p role="alert" className="text-left text-sm font-medium text-error wrap-break-word">
          {error}
        </p>
      ) : null}
      <Button type="submit" loading={pending} disabled={pending}>
        Créer la catégorie
      </Button>
    </form>
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
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [confirmRemoveId, setConfirmRemoveId] = useState<string | null>(null);
  const active =
    workspace.categories.find((category) => category.id === selectedId) ?? workspace.categories[0];

  if (!active) {
    return (
      <EmptyState
        title="Créer ma première catégorie"
        description="Votre catalogue est vide. Préparez votre catalogue pour classer les morceaux que vous proposerez."
        action={<CategoryForm onCreate={actions.createCategory} legend="Nom de la catégorie" />}
      />
    );
  }

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

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <div role="tablist" aria-label="Catégories" className="flex flex-wrap gap-2">
          {workspace.categories.map((category) => {
            const selected = category.id === active.id;
            return (
              <Button
                key={category.id}
                type="button"
                role="tab"
                aria-selected={selected}
                variant={selected ? "default" : "outline"}
                className="max-w-full whitespace-normal"
                onClick={() => setSelectedId(category.id)}
              >
                <span className="wrap-break-word">{category.name}</span>
              </Button>
            );
          })}
        </div>
        <CategoryForm onCreate={actions.createCategory} legend="Nouvelle catégorie" />
      </div>

      <section className="flex flex-col gap-4" aria-labelledby={`category-${active.id}`}>
        <h2 id={`category-${active.id}`} className="text-xl font-semibold wrap-break-word">
          {active.name}
        </h2>
        {error ? (
          <p role="alert" className="text-sm font-medium text-error wrap-break-word">
            {error}
          </p>
        ) : null}
        {active.tracks.length === 0 ? (
          <p className="text-text-secondary">Cette catégorie ne contient aucun morceau.</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {active.tracks.map((track, index) => {
              const targets = workspace.categories.filter((category) => category.id !== active.id);
              return (
                <li
                  key={track.associationId}
                  className="flex flex-col gap-3 rounded-xl border border-border bg-card p-3"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <TrackArtwork url={track.artworkUrl} />
                    <div className="min-w-0">
                      <p className="font-medium wrap-break-word">{track.title}</p>
                      <p className="text-sm text-text-secondary wrap-break-word">{track.artist}</p>
                      {track.albumTitle ? (
                        <p className="text-sm text-text-secondary wrap-break-word">
                          {track.albumTitle}
                        </p>
                      ) : null}
                      {track.disambiguation ? (
                        <p className="text-sm text-text-secondary wrap-break-word">
                          {track.disambiguation}
                        </p>
                      ) : null}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      disabled={pending || index === 0}
                      aria-label={`Monter ${track.title}`}
                      onClick={() => mutate(() => actions.reorder(track.associationId, "up"))}
                    >
                      Monter
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      disabled={pending || index === active.tracks.length - 1}
                      aria-label={`Descendre ${track.title}`}
                      onClick={() => mutate(() => actions.reorder(track.associationId, "down"))}
                    >
                      Descendre
                    </Button>
                    {confirmRemoveId === track.associationId ? (
                      <>
                        <Button
                          type="button"
                          variant="destructive"
                          disabled={pending}
                          onClick={() =>
                            mutate(async () => {
                              const result = await actions.remove(track.associationId);
                              if (result.ok) {
                                setConfirmRemoveId(null);
                              }
                              return result;
                            })
                          }
                        >
                          Confirmer le retrait
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setConfirmRemoveId(null)}
                        >
                          Annuler
                        </Button>
                      </>
                    ) : (
                      <Button
                        type="button"
                        variant="outline"
                        aria-label={`Retirer ${track.title}`}
                        onClick={() => setConfirmRemoveId(track.associationId)}
                      >
                        Retirer
                      </Button>
                    )}
                  </div>
                  {targets.length > 0 ? (
                    <form
                      className="flex flex-col gap-2 sm:flex-row sm:items-center"
                      onSubmit={(event) => {
                        event.preventDefault();
                        const data = new FormData(event.currentTarget);
                        const target = data.get("target");
                        if (typeof target !== "string" || target === "") {
                          setError("Choisissez une catégorie.");
                          return;
                        }
                        mutate(() => actions.move(track.associationId, target));
                      }}
                    >
                      <label className="sr-only" htmlFor={`move-${track.associationId}`}>
                        Déplacer {track.title} vers
                      </label>
                      <select
                        id={`move-${track.associationId}`}
                        name="target"
                        defaultValue=""
                        className={fieldClassName}
                      >
                        <option value="">Déplacer vers…</option>
                        {targets.map((category) => (
                          <option key={category.id} value={category.id}>
                            {category.name}
                          </option>
                        ))}
                      </select>
                      <Button type="submit" variant="outline" disabled={pending}>
                        Déplacer
                      </Button>
                    </form>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
        <CatalogSearch
          categoryId={active.id}
          disabled={pending}
          onAddLocal={(musicTrackId) => actions.addLocal(active.id, musicTrackId)}
          onAddExternal={(externalId) => actions.addExternal(active.id, externalId)}
        />
      </section>
    </div>
  );
}
