import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";

import { CatalogSearch } from "./catalog-search";

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

test("recherche localement après 300 ms et n'appelle MusicBrainz qu'au clic", async () => {
  vi.useFakeTimers();
  const fetchMock = vi.fn();
  vi.stubGlobal("fetch", fetchMock);

  render(
    <CatalogSearch
      categoryId="category-1"
      disabled={false}
      onAddLocal={vi.fn()}
      onAddExternal={vi.fn()}
    />,
  );

  fireEvent.change(screen.getByLabelText("Rechercher un morceau"), { target: { value: "q" } });
  await vi.advanceTimersByTimeAsync(400);
  expect(fetchMock).not.toHaveBeenCalled();

  fireEvent.change(screen.getByLabelText("Rechercher un morceau"), { target: { value: "queen" } });
  await vi.advanceTimersByTimeAsync(299);
  expect(fetchMock).not.toHaveBeenCalled();

  fetchMock.mockResolvedValueOnce({
    json: async () => ({
      ok: true,
      data: {
        results: [
          {
            id: "track-1",
            title: "Bohemian Rhapsody",
            artist: "Queen",
            albumTitle: "A Night at the Opera",
            artworkUrl: null,
          },
        ],
      },
    }),
  });
  await act(async () => {
    await vi.advanceTimersByTimeAsync(1);
  });

  expect(fetchMock).toHaveBeenCalledOnce();
  expect(String(fetchMock.mock.calls[0]?.[0])).toContain("/api/music/search?q=queen");
  expect(screen.queryByRole("heading", { name: "Autres sources" })).not.toBeInTheDocument();
  expect(screen.getByText("Bohemian Rhapsody")).toBeInTheDocument();

  fetchMock.mockResolvedValueOnce({
    json: async () => ({
      ok: true,
      data: {
        results: [
          {
            externalId: "11111111-1111-4111-8111-111111111111",
            title: "Morceau élargi",
            artist: "Artiste Lointain",
            albumTitle: null,
            durationMs: null,
            isrc: null,
            disambiguation: "version test",
          },
        ],
      },
    }),
  });

  fireEvent.click(screen.getByRole("button", { name: "Rechercher plus largement" }));
  await act(async () => {
    await vi.advanceTimersByTimeAsync(0);
  });
  expect(screen.getByRole("heading", { name: "Autres sources" })).toBeInTheDocument();
  expect(screen.getByText("Morceau élargi")).toBeInTheDocument();
  expect(screen.getByText("Bohemian Rhapsody")).toBeInTheDocument();
  expect(String(fetchMock.mock.calls[1]?.[0])).toBe("/api/music/search/external");
});

test("conserve le terme recherché quand la recherche élargie échoue", async () => {
  vi.useFakeTimers();
  const fetchMock = vi.fn();
  vi.stubGlobal("fetch", fetchMock);
  fetchMock.mockResolvedValue({
    json: async () => ({ ok: true, data: { results: [] } }),
  });

  render(
    <CatalogSearch
      categoryId="category-1"
      disabled={false}
      onAddLocal={vi.fn()}
      onAddExternal={vi.fn()}
    />,
  );

  const input = screen.getByLabelText("Rechercher un morceau");
  fireEvent.change(input, { target: { value: "lointain" } });
  await act(async () => {
    await vi.advanceTimersByTimeAsync(300);
  });
  expect(screen.getByText("Aucun morceau dans DJEAZ pour cette recherche.")).toBeInTheDocument();

  fetchMock.mockResolvedValueOnce({
    json: async () => ({
      ok: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "La recherche élargie est indisponible. Les résultats DJEAZ restent utilisables.",
      },
    }),
  });
  fireEvent.click(screen.getByRole("button", { name: "Rechercher plus largement" }));
  await act(async () => {
    await vi.advanceTimersByTimeAsync(0);
  });

  expect(
    screen.getByText(
      "La recherche élargie est indisponible. Les résultats DJEAZ restent utilisables.",
    ),
  ).toBeInTheDocument();
  expect(input).toHaveValue("lointain");
  expect(screen.getByText("Aucun morceau dans DJEAZ pour cette recherche.")).toBeInTheDocument();
});

test("le debounce local n'efface pas une recherche élargie déjà lancée", async () => {
  vi.useFakeTimers();
  const fetchMock = vi.fn(async (url: string) => {
    if (String(url).includes("/external")) {
      return {
        json: async () => ({
          ok: true,
          data: {
            results: [
              {
                externalId: "11111111-1111-4111-8111-111111111111",
                title: "Morceau élargi",
                artist: "Artiste Lointain",
                albumTitle: null,
                durationMs: null,
                isrc: null,
                disambiguation: null,
              },
            ],
          },
        }),
      };
    }

    return {
      json: async () => ({
        ok: true,
        data: {
          results: [
            {
              id: "track-1",
              title: "Bohemian Rhapsody",
              artist: "Queen",
              albumTitle: null,
              artworkUrl: null,
            },
          ],
        },
      }),
    };
  });
  vi.stubGlobal("fetch", fetchMock);

  render(
    <CatalogSearch
      categoryId="category-1"
      disabled={false}
      onAddLocal={vi.fn()}
      onAddExternal={vi.fn()}
    />,
  );

  fireEvent.change(screen.getByLabelText("Rechercher un morceau"), {
    target: { value: "lointain" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Rechercher plus largement" }));
  await act(async () => {
    await vi.advanceTimersByTimeAsync(0);
  });
  expect(screen.getByRole("heading", { name: "Autres sources" })).toBeInTheDocument();
  expect(screen.getByText("Morceau élargi")).toBeInTheDocument();

  await act(async () => {
    await vi.advanceTimersByTimeAsync(300);
  });

  expect(screen.getByRole("heading", { name: "Autres sources" })).toBeInTheDocument();
  expect(screen.getByText("Morceau élargi")).toBeInTheDocument();
  expect(screen.getByText("Bohemian Rhapsody")).toBeInTheDocument();
});

test("une réponse locale obsolète ne remplace pas la requête plus récente", async () => {
  vi.useFakeTimers();
  const resolvers: Array<(value: { json: () => Promise<unknown> }) => void> = [];
  const fetchMock = vi.fn(
    () =>
      new Promise<{ json: () => Promise<unknown> }>((resolve) => {
        resolvers.push(resolve);
      }),
  );
  vi.stubGlobal("fetch", fetchMock);

  render(
    <CatalogSearch
      categoryId="category-1"
      disabled={false}
      onAddLocal={vi.fn()}
      onAddExternal={vi.fn()}
    />,
  );

  fireEvent.change(screen.getByLabelText("Rechercher un morceau"), { target: { value: "queen" } });
  await act(async () => {
    await vi.advanceTimersByTimeAsync(300);
  });
  fireEvent.change(screen.getByLabelText("Rechercher un morceau"), {
    target: { value: "queen b" },
  });
  await act(async () => {
    await vi.advanceTimersByTimeAsync(300);
  });

  const localHit = (title: string) => ({
    json: async () => ({
      ok: true,
      data: {
        results: [{ id: title, title, artist: "Queen", albumTitle: null, artworkUrl: null }],
      },
    }),
  });

  await act(async () => {
    resolvers[1]?.(localHit("Récent"));
    resolvers[0]?.(localHit("Ancien"));
  });

  expect(screen.getByText("Récent")).toBeInTheDocument();
  expect(screen.queryByText("Ancien")).not.toBeInTheDocument();
});

test("conserve la recherche si l'ajout échoue et la réinitialise après un ajout réussi", async () => {
  vi.useFakeTimers();
  const fetchMock = vi.fn(async () => ({
    json: async () => ({
      ok: true,
      data: {
        results: [
          {
            id: "track-1",
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
  const onAddLocal = vi
    .fn()
    .mockResolvedValueOnce({
      ok: false,
      error: { code: "CONFLICT", message: "Ce morceau est déjà dans votre catalogue." },
    })
    .mockResolvedValueOnce({ ok: true, data: { associationId: "assoc-1" } });
  const onAdded = vi.fn();

  render(
    <CatalogSearch
      categoryId="category-1"
      disabled={false}
      onAddLocal={onAddLocal}
      onAddExternal={vi.fn()}
      onAdded={onAdded}
    />,
  );

  const input = screen.getByLabelText("Rechercher un morceau");
  fireEvent.change(input, { target: { value: "queen" } });
  await act(async () => {
    await vi.advanceTimersByTimeAsync(300);
  });

  fireEvent.click(screen.getByRole("button", { name: "Ajouter Bohemian Rhapsody" }));
  await act(async () => {
    await vi.advanceTimersByTimeAsync(0);
  });
  expect(onAdded).not.toHaveBeenCalled();
  expect(input).toHaveValue("queen");
  expect(screen.getByText("Bohemian Rhapsody")).toBeInTheDocument();
  expect(screen.getByText("Ce morceau est déjà dans votre catalogue.")).toBeInTheDocument();

  fireEvent.click(screen.getByRole("button", { name: "Ajouter Bohemian Rhapsody" }));
  await act(async () => {
    await vi.advanceTimersByTimeAsync(0);
  });
  expect(onAdded).toHaveBeenCalledOnce();
  expect(input).toHaveValue("");
  expect(screen.queryByText("Bohemian Rhapsody")).not.toBeInTheDocument();
});
