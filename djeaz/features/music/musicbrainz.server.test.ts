import { expect, test, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { createMusicBrainzProvider } from "./musicbrainz.server";
import { MusicProviderError } from "./types";

const USER_AGENT = "DJEAZ/0.1.0 (https://djeaz.com)";

test("envoie le User-Agent, borne le timeout et ne journalise pas le corps", async () => {
  const errors: unknown[][] = [];
  vi.spyOn(console, "error").mockImplementation((...args: unknown[]) => {
    errors.push(args);
  });

  const fetchMock = vi.fn(async (_url: URL, init: RequestInit) => {
    expect(init.headers).toMatchObject({
      Accept: "application/json",
      "User-Agent": USER_AGENT,
    });
    return new Response("{}", { status: 503 });
  });

  const provider = createMusicBrainzProvider({
    fetch: fetchMock as typeof fetch,
    userAgent: USER_AGENT,
    schedule: (task) => task(),
  });

  await expect(provider.searchRecordings("queen")).rejects.toBeInstanceOf(MusicProviderError);
  expect(fetchMock).toHaveBeenCalledOnce();
  const url = String(fetchMock.mock.calls[0]?.[0]);
  expect(url.startsWith("https://musicbrainz.org/ws/2/recording?")).toBe(true);
  expect(errors).toEqual([]);
});

test("transforme un délai dépassé en erreur propre", async () => {
  const fetchMock = vi.fn((_url: URL, init: RequestInit) => {
    return new Promise((_resolve, reject) => {
      init.signal?.addEventListener("abort", () => {
        reject(new DOMException("aborted", "AbortError"));
      });
    });
  });

  const provider = createMusicBrainzProvider({
    fetch: fetchMock as typeof fetch,
    userAgent: USER_AGENT,
    schedule: (task) => task(),
    timeoutMs: 20,
  });

  await expect(provider.getRecording("11111111-1111-4111-8111-111111111111")).rejects.toMatchObject(
    {
      name: "MusicProviderError",
      status: null,
    },
  );
});
