import { beforeEach, expect, test, vi } from "vitest";

import {
  THEME_STORAGE_KEY,
  applyThemePreference,
  persistThemePreference,
  readStoredThemePreference,
  readThemePreference,
  resolveTheme,
  themeInitScript,
  type ResolvedTheme,
} from "@/lib/theme";

let prefersDark = false;

function installMatchMedia() {
  vi.stubGlobal("matchMedia", (query: string) => ({
    matches: prefersDark,
    media: query,
  }));
}

function runInitScript() {
  window.eval(themeInitScript);
}

beforeEach(() => {
  prefersDark = false;
  installMatchMedia();
  localStorage.clear();
  document.documentElement.classList.remove("dark");
  vi.restoreAllMocks();
  installMatchMedia();
});

const cases: Array<{ stored: string | null; prefersDark: boolean; resolved: ResolvedTheme }> = [
  { stored: null, prefersDark: false, resolved: "light" },
  { stored: null, prefersDark: true, resolved: "dark" },
  { stored: "dark", prefersDark: false, resolved: "dark" },
  { stored: "light", prefersDark: true, resolved: "light" },
  { stored: "system", prefersDark: true, resolved: "dark" },
  { stored: "bleu", prefersDark: false, resolved: "light" },
  { stored: "", prefersDark: true, resolved: "dark" },
];

test.each(cases)(
  "le script d'initialisation résout $stored / sombre=$prefersDark comme le module",
  ({ stored, prefersDark: systemDark, resolved }) => {
    prefersDark = systemDark;
    if (stored === null) {
      localStorage.removeItem(THEME_STORAGE_KEY);
    } else {
      localStorage.setItem(THEME_STORAGE_KEY, stored);
    }

    expect(resolveTheme(readThemePreference(stored), systemDark)).toBe(resolved);

    document.documentElement.classList.add("dark");
    runInitScript();

    expect(document.documentElement.classList.contains("dark")).toBe(resolved === "dark");
  },
);

test("le script suit le système si la lecture du stockage échoue", () => {
  prefersDark = true;
  vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
    throw new Error("denied");
  });

  runInitScript();

  expect(document.documentElement.classList.contains("dark")).toBe(true);
  expect(readStoredThemePreference()).toBeNull();
});

test("une erreur d'écriture n'empêche pas d'appliquer le thème", () => {
  vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
    throw new Error("denied");
  });

  persistThemePreference("dark");
  applyThemePreference("dark");

  expect(document.documentElement.classList.contains("dark")).toBe(true);
  expect(localStorage.getItem(THEME_STORAGE_KEY)).toBeNull();
});
