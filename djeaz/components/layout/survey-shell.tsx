import type { ReactNode } from "react";

import { intensityProps } from "@/components/ui/intensity";

import { SurveyBottomBar } from "./survey-bottom-bar";
import { SurveyHeader } from "./survey-header";

type SurveyShellProps = {
  eventName: string;
  children: ReactNode;
  cart: ReactNode;
  validate: ReactNode;
};

/**
 * Cadre présentatif du sondage. Il porte le `<main>`.
 * La hauteur suit `dvh` : la barre reste en bas de la zone visible
 * quand le navigateur réduit le viewport pour le clavier, et le contenu défile à part.
 * Aucune donnée métier : P4 branchera l'événement, le panier et la validation.
 */
export function SurveyShell({ eventName, children, cart, validate }: SurveyShellProps) {
  return (
    <div
      {...intensityProps("public")}
      className="flex h-dvh max-h-dvh min-h-0 w-full min-w-0 flex-col overflow-hidden bg-background"
    >
      <SurveyHeader eventName={eventName} />
      <main className="min-h-0 flex-1 overflow-y-auto px-4 py-4 wrap-break-word">{children}</main>
      <SurveyBottomBar cart={cart} validate={validate} />
    </div>
  );
}
