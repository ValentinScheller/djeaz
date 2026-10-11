const DASHBOARD_PATH = "/dashboard";

/** Dernier filtre avant `router.replace`. La destination métier vient déjà de `safeReturnPath`. */
export function acceptAuthRedirect(value: string | undefined): string {
  if (
    typeof value === "string" &&
    value.startsWith("/") &&
    !value.startsWith("//") &&
    !value.includes("\\") &&
    !value.includes(":")
  ) {
    return value;
  }

  return DASHBOARD_PATH;
}
