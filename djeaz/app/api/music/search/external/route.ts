import { getAuthenticatedSession } from "@/features/auth/session.server";
import { actionError, type ActionErrorCode, type ActionResult } from "@/lib/action-result";

const STATUS: Record<ActionErrorCode, number> = {
  VALIDATION_ERROR: 400,
  UNAUTHENTICATED: 401,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_ERROR: 500,
};

function jsonResult(result: ActionResult<unknown>): Response {
  if (!result.ok) {
    return Response.json(result, { status: STATUS[result.error.code] });
  }

  return Response.json(result);
}

function sameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  const hostHeader = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  const host = hostHeader?.split(",")[0]?.trim();
  if (!origin || !host) {
    return false;
  }

  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

export async function POST(request: Request): Promise<Response> {
  if (!sameOrigin(request)) {
    return Response.json(actionError("VALIDATION_ERROR", "Requête refusée."), { status: 403 });
  }

  const session = await getAuthenticatedSession();
  if (!session.ok) {
    return Response.json(actionError("UNAUTHENTICATED", session.error.message), { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonResult(actionError("VALIDATION_ERROR", "Recherche invalide."));
  }

  const query =
    typeof body === "object" && body !== null && "query" in body && typeof body.query === "string"
      ? body.query
      : "";

  // Import différé : charger la route pendant `next build` ne doit pas ouvrir la base.
  const { searchExternalRecordings } = await import("@/features/music/search.server");
  return jsonResult(await searchExternalRecordings(query));
}
