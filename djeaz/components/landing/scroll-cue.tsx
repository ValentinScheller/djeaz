import { ChevronDownIcon } from "lucide-react";

export function ScrollCue() {
  return (
    <div className="px-4 py-6 sm:px-6 sm:py-8">
      <div className="flex items-center gap-4 sm:gap-8">
        <span aria-hidden="true" className="h-px min-w-0 flex-1 bg-border" />
        <p className="flex shrink-0 flex-col items-center gap-1 text-center text-sm font-medium text-text-secondary">
          Découvrir la solution
          <ChevronDownIcon
            aria-hidden="true"
            className="size-5 motion-safe:animate-landing-float"
          />
        </p>
        <span aria-hidden="true" className="h-px min-w-0 flex-1 bg-border" />
      </div>
    </div>
  );
}
