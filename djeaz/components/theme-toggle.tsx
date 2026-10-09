"use client";

import { MoonIcon, SunIcon } from "lucide-react";
import { useSyncExternalStore } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "cn";
import {
  applyThemePreference,
  persistThemePreference,
  prefersDarkColorScheme,
  readStoredThemePreference,
  resolveTheme,
  THEME_COLOR_SCHEME_QUERY,
  type ExplicitTheme,
  type ResolvedTheme,
} from "@/lib/theme";

const THEME_CHANGE_EVENT = "djeaz-theme-change";

const iconClassName = cn(
  "absolute inset-0 size-5 origin-center",
  "transition-[opacity,scale,rotate] duration-control ease-standard",
  "motion-reduce:rotate-0! motion-reduce:transition-none",
);

function readResolvedTheme(): ResolvedTheme {
  return resolveTheme(readStoredThemePreference(), prefersDarkColorScheme());
}

function serverResolvedTheme(): ResolvedTheme {
  return "light";
}

function subscribeToTheme(onStoreChange: () => void) {
  function onStorage() {
    applyThemePreference(readStoredThemePreference());
    onStoreChange();
  }

  window.addEventListener(THEME_CHANGE_EVENT, onStoreChange);
  window.addEventListener("storage", onStorage);

  let media: MediaQueryList | null = null;
  try {
    media = window.matchMedia(THEME_COLOR_SCHEME_QUERY);
    media.addEventListener("change", onStoreChange);
  } catch {
    media = null;
  }

  return () => {
    window.removeEventListener(THEME_CHANGE_EVENT, onStoreChange);
    window.removeEventListener("storage", onStorage);
    media?.removeEventListener("change", onStoreChange);
  };
}

export function ThemeToggle() {
  const resolved = useSyncExternalStore(subscribeToTheme, readResolvedTheme, serverResolvedTheme);

  function toggle() {
    const next: ExplicitTheme = readResolvedTheme() === "dark" ? "light" : "dark";
    persistThemePreference(next);
    applyThemePreference(next);
    window.dispatchEvent(new Event(THEME_CHANGE_EVENT));
  }

  const label = resolved === "dark" ? "Passer en mode clair" : "Passer en mode sombre";

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className="shrink-0 rounded-full"
      aria-label={label}
      onClick={toggle}
    >
      <span className="relative block size-5">
        <SunIcon
          aria-hidden="true"
          className={cn(
            iconClassName,
            "scale-90 -rotate-12 opacity-0",
            "dark:scale-100! dark:rotate-0! dark:opacity-100!",
          )}
        />
        <MoonIcon
          aria-hidden="true"
          className={cn(
            iconClassName,
            "scale-100 rotate-0 opacity-100",
            "dark:scale-90! dark:rotate-12! dark:opacity-0!",
          )}
        />
      </span>
    </Button>
  );
}
