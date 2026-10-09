import { act, fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, expect, test, vi } from "vitest";

import { ThemeSync } from "@/components/theme-sync";
import { ThemeToggle } from "@/components/theme-toggle";
import { THEME_COLOR_SCHEME_QUERY, THEME_STORAGE_KEY } from "@/lib/theme";

type MediaListener = (event: MediaQueryListEvent) => void;

const toDark = "Passer en mode sombre";
const toLight = "Passer en mode clair";

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
      act(() => {
        for (const listener of listeners) {
          listener({ matches: next, media: media.media } as MediaQueryListEvent);
        }
      });
    },
  };
}

function renderTheme(toggles = 1) {
  return render(
    <>
      <ThemeSync />
      {Array.from({ length: toggles }, (_, index) => (
        <ThemeToggle key={index} />
      ))}
    </>,
  );
}

function iconsAreHidden(button: HTMLElement) {
  for (const icon of button.querySelectorAll("svg")) {
    expect(icon).toHaveAttribute("aria-hidden", "true");
  }
  expect(button.querySelector("svg")).toBeTruthy();
}

beforeEach(() => {
  localStorage.clear();
  document.documentElement.classList.remove("dark");
  vi.unstubAllGlobals();
});

test("sans préférence, un système clair propose la lune", () => {
  const media = installMatchMedia(false);

  renderTheme();

  const button = screen.getByRole("button", { name: toDark });
  iconsAreHidden(button);
  expect(document.documentElement.classList.contains("dark")).toBe(false);
  expect(localStorage.getItem(THEME_STORAGE_KEY)).toBeNull();

  media.setMatches(true);

  expect(screen.getByRole("button", { name: toLight })).toBeInTheDocument();
  expect(document.documentElement.classList.contains("dark")).toBe(true);
  expect(localStorage.getItem(THEME_STORAGE_KEY)).toBeNull();
});

test("sans préférence, un système sombre propose le soleil", () => {
  const media = installMatchMedia(true);

  renderTheme();

  expect(screen.getByRole("button", { name: toLight })).toBeInTheDocument();
  expect(document.documentElement.classList.contains("dark")).toBe(true);

  media.setMatches(false);

  expect(screen.getByRole("button", { name: toDark })).toBeInTheDocument();
  expect(document.documentElement.classList.contains("dark")).toBe(false);
});

test("un clic depuis le clair enregistre le sombre", () => {
  installMatchMedia(false);
  renderTheme();

  fireEvent.click(screen.getByRole("button", { name: toDark }));

  expect(screen.getByRole("button", { name: toLight })).toBeInTheDocument();
  expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe("dark");
  expect(document.documentElement.classList.contains("dark")).toBe(true);
});

test("un clic depuis le sombre enregistre le clair", () => {
  installMatchMedia(true);
  renderTheme();

  fireEvent.click(screen.getByRole("button", { name: toLight }));

  expect(screen.getByRole("button", { name: toDark })).toBeInTheDocument();
  expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe("light");
  expect(document.documentElement.classList.contains("dark")).toBe(false);
});

test("une préférence sombre mémorisée prime sur le système", () => {
  const media = installMatchMedia(false);
  localStorage.setItem(THEME_STORAGE_KEY, "dark");

  renderTheme();

  expect(screen.getByRole("button", { name: toLight })).toBeInTheDocument();
  expect(document.documentElement.classList.contains("dark")).toBe(true);

  media.setMatches(true);

  expect(screen.getByRole("button", { name: toLight })).toBeInTheDocument();
  expect(document.documentElement.classList.contains("dark")).toBe(true);
});

test("une préférence claire mémorisée prime sur le système", () => {
  const media = installMatchMedia(true);
  localStorage.setItem(THEME_STORAGE_KEY, "light");

  renderTheme();

  expect(screen.getByRole("button", { name: toDark })).toBeInTheDocument();
  expect(document.documentElement.classList.contains("dark")).toBe(false);

  media.setMatches(false);

  expect(screen.getByRole("button", { name: toDark })).toBeInTheDocument();
  expect(document.documentElement.classList.contains("dark")).toBe(false);
});

test("une valeur system mémorisée suit le système", () => {
  const media = installMatchMedia(true);
  localStorage.setItem(THEME_STORAGE_KEY, "system");

  renderTheme();

  expect(screen.getByRole("button", { name: toLight })).toBeInTheDocument();
  expect(document.documentElement.classList.contains("dark")).toBe(true);
  expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe("system");

  media.setMatches(false);

  expect(screen.getByRole("button", { name: toDark })).toBeInTheDocument();
  expect(document.documentElement.classList.contains("dark")).toBe(false);
});

test("une valeur de stockage inconnue revient au système", () => {
  installMatchMedia(true);
  localStorage.setItem(THEME_STORAGE_KEY, "bleu");

  renderTheme();

  expect(screen.getByRole("button", { name: toLight })).toBeInTheDocument();
  expect(document.documentElement.classList.contains("dark")).toBe(true);
});

test("les bascules montées ensemble restent synchronisées", () => {
  installMatchMedia(false);
  renderTheme(2);

  fireEvent.click(screen.getAllByRole("button", { name: toDark })[0]);

  expect(screen.getAllByRole("button", { name: toLight })).toHaveLength(2);
  expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe("dark");
  expect(document.documentElement.classList.contains("dark")).toBe(true);
});

test("la bascule focusable garde le focus après activation", () => {
  installMatchMedia(false);
  renderTheme();

  const button = screen.getByRole("button", { name: toDark });
  button.focus();
  expect(button).toHaveFocus();
  expect(button.tagName).toBe("BUTTON");

  fireEvent.click(button);

  expect(screen.getByRole("button", { name: toLight })).toHaveFocus();
  expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe("dark");
});

test("le contrôle retire son écoute du système au démontage", () => {
  const media = installMatchMedia(false);
  const { unmount } = renderTheme();

  unmount();
  media.setMatches(true);

  expect(document.documentElement.classList.contains("dark")).toBe(false);
});
