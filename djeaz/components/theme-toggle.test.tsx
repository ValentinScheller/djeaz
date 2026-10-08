import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, expect, test, vi } from "vitest";

import { ThemeSync } from "@/components/theme-sync";
import { ThemeToggle } from "@/components/theme-toggle";
import { THEME_COLOR_SCHEME_QUERY, THEME_STORAGE_KEY } from "@/lib/theme";

type MediaListener = (event: MediaQueryListEvent) => void;

function installMatchMedia(matches: boolean) {
  const listeners = new Set<MediaListener>();
  const media = {
    matches,
    media: THEME_COLOR_SCHEME_QUERY,
    addEventListener(_type: string, listener: MediaListener) {
      listeners.add(listener);
    },
    removeEventListener(_type: string, listener: MediaListener) {
      listeners.delete(listener);
    },
  };

  vi.stubGlobal("matchMedia", (query: string) => {
    if (query !== THEME_COLOR_SCHEME_QUERY) {
      return {
        ...media,
        matches: false,
        media: query,
        addEventListener() {},
        removeEventListener() {},
      };
    }

    return media;
  });

  return {
    setMatches(next: boolean) {
      media.matches = next;
      for (const listener of listeners) {
        listener({ matches: next, media: media.media } as MediaQueryListEvent);
      }
    },
  };
}

function renderTheme() {
  return render(
    <>
      <ThemeSync />
      <ThemeToggle />
    </>,
  );
}

beforeEach(() => {
  localStorage.clear();
  document.documentElement.classList.remove("dark");
  vi.unstubAllGlobals();
});

test("sans préférence mémorisée, le thème suit le système", () => {
  const media = installMatchMedia(true);

  renderTheme();

  expect(screen.getByRole("group", { name: "Thème" })).toBeInTheDocument();
  expect(screen.getByRole("radio", { name: "Système" })).toBeChecked();
  expect(screen.getByRole("radio", { name: "Clair" })).not.toBeChecked();
  expect(screen.getByRole("radio", { name: "Sombre" })).not.toBeChecked();
  expect(document.documentElement.classList.contains("dark")).toBe(true);

  media.setMatches(false);

  expect(document.documentElement.classList.contains("dark")).toBe(false);
  expect(screen.getByRole("radio", { name: "Système" })).toBeChecked();
});

test("une préférence sombre mémorisée prime sur le système", () => {
  const media = installMatchMedia(false);
  localStorage.setItem(THEME_STORAGE_KEY, "dark");

  renderTheme();

  expect(screen.getByRole("radio", { name: "Sombre" })).toBeChecked();
  expect(document.documentElement.classList.contains("dark")).toBe(true);

  media.setMatches(true);

  expect(screen.getByRole("radio", { name: "Sombre" })).toBeChecked();
  expect(document.documentElement.classList.contains("dark")).toBe(true);
});

test("une préférence claire mémorisée prime sur le système", () => {
  const media = installMatchMedia(true);
  localStorage.setItem(THEME_STORAGE_KEY, "light");

  renderTheme();

  expect(screen.getByRole("radio", { name: "Clair" })).toBeChecked();
  expect(document.documentElement.classList.contains("dark")).toBe(false);

  media.setMatches(false);

  expect(document.documentElement.classList.contains("dark")).toBe(false);
});

test("une valeur de stockage inconnue revient au système", () => {
  installMatchMedia(true);
  localStorage.setItem(THEME_STORAGE_KEY, "bleu");

  renderTheme();

  expect(screen.getByRole("radio", { name: "Système" })).toBeChecked();
  expect(document.documentElement.classList.contains("dark")).toBe(true);
});

test("le choix est mémorisé et Système retire la préférence explicite", () => {
  const media = installMatchMedia(true);

  renderTheme();

  fireEvent.click(screen.getByRole("radio", { name: "Clair" }));

  expect(screen.getByRole("radio", { name: "Clair" })).toBeChecked();
  expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe("light");
  expect(document.documentElement.classList.contains("dark")).toBe(false);

  media.setMatches(false);

  expect(document.documentElement.classList.contains("dark")).toBe(false);

  fireEvent.click(screen.getByRole("radio", { name: "Sombre" }));

  expect(screen.getByRole("radio", { name: "Sombre" })).toBeChecked();
  expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe("dark");
  expect(document.documentElement.classList.contains("dark")).toBe(true);

  fireEvent.click(screen.getByRole("radio", { name: "Système" }));

  expect(screen.getByRole("radio", { name: "Système" })).toBeChecked();
  expect(localStorage.getItem(THEME_STORAGE_KEY)).toBeNull();
  expect(document.documentElement.classList.contains("dark")).toBe(false);

  media.setMatches(true);

  expect(document.documentElement.classList.contains("dark")).toBe(true);
});

test("le contrôle retire son écoute du système au démontage", () => {
  const media = installMatchMedia(false);
  const { unmount } = renderTheme();

  unmount();
  media.setMatches(true);

  expect(document.documentElement.classList.contains("dark")).toBe(false);
});
