import type { ReactNode } from "react";

export function SurveyBottomBar({ cart, validate }: { cart: ReactNode; validate: ReactNode }) {
  return (
    <div
      role="region"
      aria-label="Panier et validation"
      className="shrink-0 border-t border-border bg-surface shadow-public"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="flex flex-wrap items-center gap-3 px-4 py-3">
        <div className="flex min-h-11 min-w-0 flex-1 items-center">{cart}</div>
        <div className="flex min-h-11 shrink-0 items-center">{validate}</div>
      </div>
    </div>
  );
}
