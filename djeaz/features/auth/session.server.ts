import "server-only";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";

import { auth } from "./server";

const SIGN_IN_PATH = "/sign-in";
const DEFAULT_RETURN_PATH = "/dashboard";
const MAX_RETURN_PATH_LENGTH = 2048;
const INTERNAL_ORIGIN = "http://djeaz.local";

const UNAUTHENTICATED_MESSAGE = "Connexion requise.";

export type CurrentSession = NonNullable<Awaited<ReturnType<typeof auth.getSession>>>;

export type SessionResult =
  | { ok: true; data: CurrentSession }
  | { ok: false; error: { code: "UNAUTHENTICATED"; message: string } };

function unauthenticated(): SessionResult {
  return {
    ok: false,
    error: { code: "UNAUTHENTICATED", message: UNAUTHENTICATED_MESSAGE },
  };
}

function isCurrentSession(session: CurrentSession | null): session is CurrentSession {
  return (
    session !== null && session.user.id.length > 0 && session.session.userId === session.user.id
  );
}

// Dédupe les lectures dans une même requête React. Hors rendu, `cache` n'est pas partagé.
const readRequestSession = cache(async (): Promise<CurrentSession | null> => {
  const requestHeaders = await headers();
  return auth.getSession(requestHeaders);
});

// `data.user.id` vient de la session validée. Aucun identifiant client n'est accepté.
export async function getAuthenticatedSession(): Promise<SessionResult> {
  const session = await readRequestSession();
  if (!isCurrentSession(session)) {
    return unauthenticated();
  }

  return { ok: true, data: session };
}

function internalReturnPath(value: string): string {
  const candidate = value.trim();
  if (
    candidate.length === 0 ||
    candidate.length > MAX_RETURN_PATH_LENGTH ||
    !candidate.startsWith("/") ||
    candidate.startsWith("//") ||
    candidate.includes("\\")
  ) {
    return DEFAULT_RETURN_PATH;
  }

  let url: URL;
  try {
    url = new URL(candidate, INTERNAL_ORIGIN);
  } catch {
    return DEFAULT_RETURN_PATH;
  }

  if (url.origin !== INTERNAL_ORIGIN || url.username !== "" || url.password !== "") {
    return DEFAULT_RETURN_PATH;
  }

  const path = `${url.pathname}${url.search}${url.hash}`;
  if (!path.startsWith("/") || path.startsWith("//") || path.includes("\\")) {
    return DEFAULT_RETURN_PATH;
  }

  return path;
}

export function safeReturnPath(value: string | null | undefined): string {
  if (typeof value !== "string") {
    return DEFAULT_RETURN_PATH;
  }

  return internalReturnPath(value);
}

function requestsDashboard(value: string): boolean {
  const candidate = value.trim();
  return (
    candidate === DEFAULT_RETURN_PATH ||
    candidate.startsWith(`${DEFAULT_RETURN_PATH}?`) ||
    candidate.startsWith(`${DEFAULT_RETURN_PATH}#`)
  );
}

/** `undefined` si l'entrée est vide ou rejetée. Une valeur sûre peut être reprise dans un lien. */
export function preservedReturnTo(value: string | null | undefined): string | undefined {
  if (typeof value !== "string" || value.trim() === "") {
    return undefined;
  }

  const safe = internalReturnPath(value);
  if (safe === DEFAULT_RETURN_PATH && !requestsDashboard(value)) {
    return undefined;
  }

  return safe;
}

export function readReturnToParam(value: string | string[] | undefined): string | undefined {
  return preservedReturnTo(typeof value === "string" ? value : undefined);
}

export function authPagePath(path: "/sign-in" | "/sign-up", returnTo: string | undefined): string {
  if (!returnTo) {
    return path;
  }

  return `${path}?returnTo=${encodeURIComponent(returnTo)}`;
}

export function signInRedirectPath(returnPath: string): string {
  return `${SIGN_IN_PATH}?returnTo=${encodeURIComponent(safeReturnPath(returnPath))}`;
}

export async function redirectAuthenticatedToDashboard(): Promise<void> {
  const result = await getAuthenticatedSession();
  if (result.ok) {
    redirect("/dashboard");
  }
}

export async function requirePageSession(returnPath: string): Promise<CurrentSession> {
  const result = await getAuthenticatedSession();
  if (!result.ok) {
    redirect(signInRedirectPath(returnPath));
  }

  return result.data;
}
