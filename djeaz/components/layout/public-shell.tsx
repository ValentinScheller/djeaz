import type { ReactNode } from "react";

import { intensityProps } from "@/components/ui/intensity";

import { PublicFooter } from "./public-footer";
import { PublicHeader } from "./public-header";

/**
 * La page publique fournit le `<main>`.
 * Cette coque porte l'en-tête et le pied de page.
 */
export function PublicShell({ children }: { children: ReactNode }) {
  return (
    <div {...intensityProps("public")} className="flex min-h-dvh w-full min-w-0 flex-1 flex-col">
      <PublicHeader />
      {children}
      <PublicFooter />
    </div>
  );
}
