export const THEME_STORAGE_KEY = "djeaz-theme";
export const THEME_COLOR_SCHEME_QUERY = "(prefers-color-scheme: dark)";

export type ExplicitTheme = "light" | "dark";
export type ResolvedTheme = ExplicitTheme;

export function readThemePreference(value: string | null): ExplicitTheme | null {
  if (value === "light" || value === "dark") {
    return value;
  }

  return null;
}

export function resolveTheme(
  preference: ExplicitTheme | null,
  prefersDark: boolean,
): ResolvedTheme {
  if (preference !== null) {
    return preference;
  }

  return prefersDark ? "dark" : "light";
}

export function readStoredThemePreference(): ExplicitTheme | null {
  try {
    return readThemePreference(localStorage.getItem(THEME_STORAGE_KEY));
  } catch {
    // localStorage peut être indisponible.
    return null;
  }
}

export function persistThemePreference(preference: ExplicitTheme | null): void {
  try {
    if (preference === null) {
      localStorage.removeItem(THEME_STORAGE_KEY);
      return;
    }

    localStorage.setItem(THEME_STORAGE_KEY, preference);
  } catch {
    // Le thème reste appliqué pour cette vue si le stockage échoue.
  }
}

export function prefersDarkColorScheme(): boolean {
  try {
    return window.matchMedia(THEME_COLOR_SCHEME_QUERY).matches;
  } catch {
    return false;
  }
}

export function applyResolvedTheme(resolved: ResolvedTheme): void {
  document.documentElement.classList.toggle("dark", resolved === "dark");
}

export function applyThemePreference(preference: ExplicitTheme | null): void {
  applyResolvedTheme(resolveTheme(preference, prefersDarkColorScheme()));
}

// Même résolution que readThemePreference + resolveTheme. Le test unitaire exécute ce script.
export const themeInitScript = `(function () {
  try {
    var stored = null;
    try {
      stored = localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)});
    } catch (error) {}
    var preference = stored === "light" || stored === "dark" ? stored : null;
    var prefersDark = false;
    try {
      prefersDark = window.matchMedia(${JSON.stringify(THEME_COLOR_SCHEME_QUERY)}).matches;
    } catch (error) {}
    var resolved = preference !== null ? preference : prefersDark ? "dark" : "light";
    document.documentElement.classList.toggle("dark", resolved === "dark");
  } catch (error) {}
})();`;
