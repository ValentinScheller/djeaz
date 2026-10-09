import Image from "next/image";
import { cn } from "cn";

/**
 * Les noms de fichiers décrivent la couleur du lettrage, pas le thème.
 * `logo-dark.svg` est indigo (#5755c9), lisible sur le fond clair.
 * `logo-light.svg` est abricot (#ffbd99), lisible sur le fond sombre.
 * La bascule suit uniquement la classe `.dark`.
 */
const LOGO_WIDTH = 300;
const LOGO_HEIGHT = 100;

type LogoProps = {
  className?: string;
  /**
   * Nom accessible. Une chaîne vide laisse le logo décoratif :
   * le parent porte alors le nom, par exemple un lien.
   */
  alt?: string;
};

export function Logo({ className, alt = "DJEAZ" }: LogoProps) {
  const labelled = alt.length > 0;

  return (
    <span
      className={cn("inline-block w-[300px] max-w-full", className)}
      {...(labelled ? { role: "img" as const, "aria-label": alt } : {})}
    >
      <Image
        src="/logo-dark.svg"
        alt=""
        width={LOGO_WIDTH}
        height={LOGO_HEIGHT}
        unoptimized
        className="h-auto w-full dark:hidden"
        loading="eager"
      />
      <Image
        src="/logo-light.svg"
        alt=""
        width={LOGO_WIDTH}
        height={LOGO_HEIGHT}
        unoptimized
        className="hidden h-auto w-full dark:block"
        loading="eager"
      />
    </span>
  );
}
