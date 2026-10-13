export const ACTION_ERROR_CODES = [
  "VALIDATION_ERROR",
  "UNAUTHENTICATED",
  "NOT_FOUND",
  "CONFLICT",
  "INTERNAL_ERROR",
] as const;

export type ActionErrorCode = (typeof ACTION_ERROR_CODES)[number];

export type ActionFailure = {
  ok: false;
  error: {
    code: ActionErrorCode;
    message: string;
    fieldErrors?: Record<string, string>;
  };
};

export type ActionResult<T> = { ok: true; data: T } | ActionFailure;

export function actionError(
  code: ActionErrorCode,
  message: string,
  fieldErrors?: Record<string, string>,
): ActionFailure {
  return {
    ok: false,
    error: fieldErrors ? { code, message, fieldErrors } : { code, message },
  };
}
