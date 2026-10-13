"use client";

import { useEffect, useRef, useState, type Ref } from "react";

import { TrackArtwork } from "@/components/catalog/track-artwork";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SEARCH_DEBOUNCE_MS } from "@/features/music/limits";
import { parseMusicQuery } from "@/features/music/text";
import type { ExternalCandidate, LocalTrackHit } from "@/features/music/types";
import type { ActionResult } from "@/lib/action-result";

type CatalogSearchProps = {
  categoryId: string;
  disabled: boolean;
  inputRef?: Ref<HTMLInputElement>;
  onAdded?: () => void;
  onAddLocal: (musicTrackId: string) => Promise<ActionResult<{ associationId: string }>>;
  onAddExternal: (externalId: string) => Promise<ActionResult<{ associationId: string }>>;
};

const LOCAL_FAILURE = "La recherche dans DJEAZ a échoué. Réessayez.";
const EXTERNAL_FAILURE =
  "La recherche élargie est indisponible. Les résultats DJEAZ restent utilisables.";

async function readResult<T>(response: Response): Promise<ActionResult<T>> {
  try {
    return (await response.json()) as ActionResult<T>;
  } catch {
    return { ok: false, error: { code: "INTERNAL_ERROR", message: LOCAL_FAILURE } };
  }
}

function HitLine({
  title,
  artist,
  albumTitle,
  artworkUrl,
  detail,
}: {
  title: string;
  artist: string;
  albumTitle: string | null;
  artworkUrl: string | null;
  detail?: string | null;
}) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <TrackArtwork url={artworkUrl} />
      <div className="min-w-0">
        <p className="font-medium wrap-break-word">{title}</p>
        <p className="text-sm text-text-secondary wrap-break-word">{artist}</p>
        {albumTitle ? (
          <p className="text-sm text-text-secondary wrap-break-word">{albumTitle}</p>
        ) : null}
        {detail ? <p className="text-sm text-text-secondary wrap-break-word">{detail}</p> : null}
      </div>
    </div>
  );
}

export function CatalogSearch({
  categoryId,
  disabled,
  inputRef,
  onAdded,
  onAddLocal,
  onAddExternal,
}: CatalogSearchProps) {
  const [query, setQuery] = useState("");
  const [localResults, setLocalResults] = useState<LocalTrackHit[]>([]);
  const [localState, setLocalState] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [localError, setLocalError] = useState<string | null>(null);
  const [externalResults, setExternalResults] = useState<ExternalCandidate[] | null>(null);
  const [externalState, setExternalState] = useState<"idle" | "loading" | "error">("idle");
  const [externalError, setExternalError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [addingId, setAddingId] = useState<string | null>(null);
  const localGeneration = useRef(0);
  const externalGeneration = useRef(0);

  useEffect(() => {
    const parsed = parseMusicQuery(query);
    if (!parsed.ok) {
      return;
    }

    const localId = localGeneration.current + 1;
    localGeneration.current = localId;
    const externalSnapshot = externalGeneration.current;
    const controller = new AbortController();
    const timer = setTimeout(() => {
      if (localId !== localGeneration.current) {
        return;
      }

      setLocalState("loading");
      setLocalError(null);
      if (externalGeneration.current === externalSnapshot) {
        setExternalResults(null);
        setExternalState("idle");
        setExternalError(null);
      }

      void (async () => {
        try {
          const response = await fetch(
            `/api/music/search?q=${encodeURIComponent(parsed.normalized)}`,
            { signal: controller.signal, credentials: "same-origin" },
          );
          const result = await readResult<{ results: LocalTrackHit[] }>(response);
          if (controller.signal.aborted || localId !== localGeneration.current) {
            return;
          }
          if (!result.ok) {
            setLocalState("error");
            setLocalError(result.error.message || LOCAL_FAILURE);
            setLocalResults([]);
            return;
          }
          setLocalResults(result.data.results);
          setLocalState("ready");
        } catch (error) {
          if (error instanceof DOMException && error.name === "AbortError") {
            return;
          }
          if (controller.signal.aborted || localId !== localGeneration.current) {
            return;
          }
          setLocalState("error");
          setLocalError(LOCAL_FAILURE);
          setLocalResults([]);
        }
      })();
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  async function searchWider() {
    const parsed = parseMusicQuery(query);
    if (!parsed.ok) {
      return;
    }

    const externalId = externalGeneration.current + 1;
    externalGeneration.current = externalId;
    setExternalState("loading");
    setExternalError(null);
    setActionError(null);

    try {
      const response = await fetch("/api/music/search/external", {
        method: "POST",
        credentials: "same-origin",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ query: parsed.normalized }),
      });
      const result = await readResult<{ results: ExternalCandidate[] }>(response);
      if (externalId !== externalGeneration.current) {
        return;
      }
      if (!result.ok) {
        setExternalState("error");
        setExternalError(result.error.message || EXTERNAL_FAILURE);
        setExternalResults([]);
        return;
      }
      setExternalResults(result.data.results);
      setExternalState("idle");
    } catch {
      if (externalId !== externalGeneration.current) {
        return;
      }
      setExternalState("error");
      setExternalError(EXTERNAL_FAILURE);
      setExternalResults([]);
    }
  }

  function resetSearch() {
    localGeneration.current += 1;
    externalGeneration.current += 1;
    setQuery("");
    setLocalResults([]);
    setLocalState("idle");
    setLocalError(null);
    setExternalResults(null);
    setExternalState("idle");
    setExternalError(null);
    setActionError(null);
    setAddingId(null);
  }

  async function addLocal(track: LocalTrackHit) {
    setAddingId(track.id);
    setActionError(null);
    const result = await onAddLocal(track.id);
    if (!result.ok) {
      setAddingId(null);
      setActionError(result.error.message);
      return;
    }
    resetSearch();
    onAdded?.();
  }

  async function addExternal(candidate: ExternalCandidate) {
    setAddingId(candidate.externalId);
    setActionError(null);
    const result = await onAddExternal(candidate.externalId);
    if (!result.ok) {
      setAddingId(null);
      setActionError(result.error.message);
      return;
    }
    resetSearch();
    onAdded?.();
  }

  const canSearchWider = parseMusicQuery(query).ok && externalState !== "loading" && !disabled;

  return (
    <section className="flex flex-col gap-4" aria-label="Recherche de morceaux">
      <div className="flex flex-col gap-2">
        <Label htmlFor={`catalog-search-${categoryId}`}>Rechercher un morceau</Label>
        <Input
          ref={inputRef}
          id={`catalog-search-${categoryId}`}
          value={query}
          maxLength={200}
          placeholder="Titre ou artiste"
          autoComplete="off"
          onChange={(event) => {
            const next = event.target.value;
            const parsed = parseMusicQuery(next);
            externalGeneration.current += 1;
            setQuery(next);
            setActionError(null);
            setExternalResults(null);
            setExternalState("idle");
            setExternalError(null);
            if (!parsed.ok) {
              setLocalResults([]);
              setLocalState("idle");
              setLocalError(parsed.reason === "too_short" ? null : "La recherche est trop longue.");
              return;
            }
            setLocalError(null);
          }}
        />
      </div>

      {actionError ? (
        <p role="alert" className="text-sm font-medium text-error wrap-break-word">
          {actionError}
        </p>
      ) : null}

      <div aria-live="polite" className="flex flex-col gap-3">
        <h3 className="text-base font-semibold">Dans DJEAZ</h3>
        {localState === "loading" ? <p className="text-text-secondary">Recherche…</p> : null}
        {localError ? (
          <p role="alert" className="text-sm font-medium text-error wrap-break-word">
            {localError}
          </p>
        ) : null}
        {localState === "ready" && localResults.length === 0 ? (
          <p className="text-text-secondary">Aucun morceau dans DJEAZ pour cette recherche.</p>
        ) : null}
        {localResults.length > 0 ? (
          <ul className="flex flex-col gap-2">
            {localResults.map((track) => (
              <li
                key={track.id}
                className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <HitLine
                  title={track.title}
                  artist={track.artist}
                  albumTitle={track.albumTitle}
                  artworkUrl={track.artworkUrl}
                />
                <Button
                  type="button"
                  disabled={disabled || addingId === track.id}
                  loading={addingId === track.id}
                  aria-label={`Ajouter ${track.title}`}
                  onClick={() => void addLocal(track)}
                >
                  Ajouter
                </Button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      <div>
        <Button
          type="button"
          variant="outline"
          disabled={!canSearchWider}
          onClick={() => void searchWider()}
          loading={externalState === "loading"}
        >
          Rechercher plus largement
        </Button>
      </div>

      {externalResults || externalError ? (
        <div className="flex flex-col gap-3 rounded-xl border border-border bg-accent/40 p-3">
          <h3 className="text-base font-semibold">Autres sources</h3>
          {externalError ? (
            <p role="alert" className="text-sm font-medium text-error wrap-break-word">
              {externalError}
            </p>
          ) : null}
          {externalResults && externalResults.length === 0 && !externalError ? (
            <p className="text-text-secondary">Aucun morceau trouvé dans les autres sources.</p>
          ) : null}
          {externalResults && externalResults.length > 0 ? (
            <ul className="flex flex-col gap-2">
              {externalResults.map((candidate) => (
                <li
                  key={candidate.externalId}
                  className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <HitLine
                    title={candidate.title}
                    artist={candidate.artist}
                    albumTitle={candidate.albumTitle}
                    artworkUrl={null}
                    detail={candidate.disambiguation}
                  />
                  <Button
                    type="button"
                    disabled={disabled || addingId === candidate.externalId}
                    loading={addingId === candidate.externalId}
                    aria-label={`Ajouter ${candidate.title}`}
                    onClick={() => void addExternal(candidate)}
                  >
                    Ajouter
                  </Button>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
