import Image from "next/image";
import { cn } from "cn";

/**
 * viewBox officiel 600 × 600.
 * Le SVG embarque deux PNG : Next.js 16 sert ce fichier tel quel
 * (`BYPASS_TYPES` inclut `image/svg+xml`), sans recompresser les rasters.
 */
const MASCOT_SIZE = 600;

type MascotProps = {
  /** Vide : décorative. Renseigné seulement si l'image porte une information. */
  alt?: string;
  className?: string;
  /**
   * Largeur d'affichage prévue. Ignorée tant que la source reste un SVG :
   * Next.js sert alors le fichier original, sans `srcset`.
   */
  sizes?: string;
};

export function Mascot({ alt = "", className, sizes = "15rem" }: MascotProps) {
  return (
    <Image
      src="/mascotte.svg"
      alt={alt}
      width={MASCOT_SIZE}
      height={MASCOT_SIZE}
      sizes={sizes}
      unoptimized
      className={cn("h-auto w-60 max-w-full", className)}
      loading="eager"
    />
  );
}
