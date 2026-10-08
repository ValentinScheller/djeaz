export const intensities = ["public", "dashboard"] as const;

export type Intensity = (typeof intensities)[number];

/**
 * Public est l'intensité par défaut, portée par `:root`.
 * Poser `data-intensity` sur une coque ou un contrôle : les variables héritées
 * (taille tactile, relief) changent pour cet élément et ses descendants.
 * Une valeur imbriquée remplace celle du parent.
 */
export function intensityProps(intensity?: Intensity) {
  if (!intensity) {
    return {};
  }

  return { "data-intensity": intensity } as const;
}
