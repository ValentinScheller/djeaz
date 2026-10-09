const SAFE_DIGEST = /^[A-Za-z0-9_-]{1,64}(?:@[A-Za-z0-9_-]{1,32})?$/;

/**
 * Digest Next.js affichable.
 * Un message, une pile, du SQL ou un secret ne correspond pas à ce format.
 */
export function readErrorDigest(error: unknown): string | undefined {
  if (typeof error !== "object" || error === null || !("digest" in error)) {
    return undefined;
  }

  const digest = (error as { digest?: unknown }).digest;

  if (typeof digest !== "string" || !SAFE_DIGEST.test(digest)) {
    return undefined;
  }

  return digest;
}

/** Identifiant local. L'appelant le mémorise pour le garder stable. */
export function createLocalDiagnosticId(): string {
  const bytes = new Uint8Array(8);
  crypto.getRandomValues(bytes);

  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}
