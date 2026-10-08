"use client";

import { useEffect, useLayoutEffect } from "react";

import {
  applyThemePreference,
  readStoredThemePreference,
  THEME_COLOR_SCHEME_QUERY,
} from "@/lib/theme";

export function ThemeSync() {
  // Le script bloquant pose la classe avant peinture. Strict Mode, en développement,
  // réinitialise <html> au remontage : on réapplique avant la peinture suivante.
  useLayoutEffect(() => {
    applyThemePreference(readStoredThemePreference());
  }, []);

  useEffect(() => {
    const media = window.matchMedia(THEME_COLOR_SCHEME_QUERY);

    function onChange() {
      const preference = readStoredThemePreference();
      if (preference !== null) {
        return;
      }

      applyThemePreference(null);
    }

    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  return null;
}
