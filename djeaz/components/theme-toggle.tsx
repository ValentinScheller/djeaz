"use client";

import { useLayoutEffect, useRef } from "react";

import {
  applyThemePreference,
  persistThemePreference,
  preferenceFromThemeChoice,
  readStoredThemePreference,
  themeChoiceFromPreference,
  type ThemeChoice,
} from "@/lib/theme";

const THEME_OPTIONS = [
  { value: "system", label: "Système" },
  { value: "light", label: "Clair" },
  { value: "dark", label: "Sombre" },
] as const satisfies ReadonlyArray<{ value: ThemeChoice; label: string }>;

export function ThemeToggle() {
  const fieldsetRef = useRef<HTMLFieldSetElement>(null);

  // Le HTML initial coche « Système » pour rester identique au rendu serveur.
  // La préférence réelle est appliquée ici, avant peinture, sans second rendu.
  useLayoutEffect(() => {
    const choice = themeChoiceFromPreference(readStoredThemePreference());
    const input = fieldsetRef.current?.querySelector<HTMLInputElement>(`input[value="${choice}"]`);

    if (input) {
      input.checked = true;
    }
  }, []);

  function select(next: ThemeChoice) {
    const preference = preferenceFromThemeChoice(next);
    persistThemePreference(preference);
    applyThemePreference(preference);
  }

  return (
    <fieldset
      ref={fieldsetRef}
      className="m-0 flex max-w-full flex-wrap items-center gap-2 border-0 p-0"
    >
      <legend className="px-1 text-text-secondary">Thème</legend>
      <div className="flex max-w-full flex-wrap gap-1 rounded-card border border-border bg-surface p-1">
        {THEME_OPTIONS.map((option) => (
          <label
            key={option.value}
            className={[
              "inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-pill px-3 font-medium text-text",
              "transition-[background-color,color] duration-control ease-standard",
              "focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-focus",
              "has-[:checked]:bg-action has-[:checked]:text-action-foreground",
            ].join(" ")}
          >
            <input
              type="radio"
              name="djeaz-theme"
              value={option.value}
              defaultChecked={option.value === "system"}
              onChange={() => select(option.value)}
              className="size-4 shrink-0 accent-action"
            />
            {option.label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
