import { getAuthenticatedSession } from "@/features/auth/session.server";
import { searchLocalTracks } from "@/features/music/search.server";
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
  if (!origin) {
    return request.method === "GET";
  }

  const hostHeader = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  const host = hostHeader?.split(",")[0]?.trim();
  if (!host) {
    return false;
  }

  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

export async function GET(request: Request): Promise<Response> {
  if (!sameOrigin(request)) {
    return Response.json(actionError("VALIDATION_ERROR", "Requête refusée."), { status: 403 });
  }

  const session = await getAuthenticatedSession();
  if (!session.ok) {
    return Response.json(actionError("UNAUTHENTICATED", session.error.message), { status: 401 });
  }

  const query = new URL(request.url).searchParams.get("q") ?? "";
  return jsonResult(await searchLocalTracks(query));
}
