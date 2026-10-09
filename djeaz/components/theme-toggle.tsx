"use client";

import { useEffect, useLayoutEffect, useRef } from "react";

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

const THEME_CHANGE_EVENT = "djeaz-theme-change";

type ThemeToggleProps = {
  /**
   * Nom du groupe radio. À rendre unique lorsque plusieurs bascules
   * sont montées ensemble, par exemple sidebar et barre mobile.
   */
  name?: string;
};

function storedChoice() {
  return themeChoiceFromPreference(readStoredThemePreference());
}

function checkStoredChoice(fieldset: HTMLFieldSetElement | null) {
  const input = fieldset?.querySelector<HTMLInputElement>(`input[value="${storedChoice()}"]`);

  if (input) {
    input.checked = true;
  }
}

export function ThemeToggle({ name = "djeaz-theme" }: ThemeToggleProps) {
  const fieldsetRef = useRef<HTMLFieldSetElement>(null);

  // Le HTML initial coche « Système » pour rester identique au rendu serveur.
  // La préférence réelle est appliquée ici, avant peinture, sans second rendu.
  useLayoutEffect(() => {
    checkStoredChoice(fieldsetRef.current);
  }, []);

  // Plusieurs bascules peuvent être montées (une seule visible). Un changement
  // dans l'une aligne les autres sans second système de thème.
  useEffect(() => {
    function onThemeChange() {
      checkStoredChoice(fieldsetRef.current);
    }

    window.addEventListener(THEME_CHANGE_EVENT, onThemeChange);
    window.addEventListener("storage", onThemeChange);
    return () => {
      window.removeEventListener(THEME_CHANGE_EVENT, onThemeChange);
      window.removeEventListener("storage", onThemeChange);
    };
  }, []);

  function select(next: ThemeChoice) {
    const preference = preferenceFromThemeChoice(next);
    persistThemePreference(preference);
    applyThemePreference(preference);
    window.dispatchEvent(new Event(THEME_CHANGE_EVENT));
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
              name={name}
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
