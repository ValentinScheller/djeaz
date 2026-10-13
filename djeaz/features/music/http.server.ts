import "server-only";

import { PROVIDER_TIMEOUT_MS } from "./limits";
import { MusicProviderError } from "./types";

type FetchJsonOptions = {
  fetch?: typeof fetch;
  timeoutMs?: number;
};

/** Timeout borné. `null` signifie un 404 : l'appelant décide si c'est une absence. */
export async function fetchProviderJson(
  url: URL,
  userAgent: string,
  options?: FetchJsonOptions,
): Promise<unknown> {
  const fetchImpl = options?.fetch ?? fetch;
  const timeoutMs = options?.timeoutMs ?? PROVIDER_TIMEOUT_MS;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetchImpl(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "User-Agent": userAgent,
      },
      signal: controller.signal,
      cache: "no-store",
      redirect: "follow",
    });

    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      throw new MusicProviderError(response.status);
    }

    try {
      return await response.json();
    } catch {
      throw new MusicProviderError(response.status);
    }
  } catch (error) {
    if (error instanceof MusicProviderError) {
      throw error;
    }
    throw new MusicProviderError(null);
  } finally {
    clearTimeout(timer);
  }
}

export function logProviderFailure(error: unknown): void {
  if (error instanceof MusicProviderError) {
    console.error(`[music] provider status=${error.status ?? "unavailable"}`);
    return;
  }

  const name = error instanceof Error ? error.name : "unknown";
  console.error(`[music] provider ${name}`);
}
