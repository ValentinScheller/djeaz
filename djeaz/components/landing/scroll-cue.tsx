import { ChevronDownIcon } from "lucide-react";
import type { CSSProperties } from "react";

const BAR_COUNT = 96;

type Bar = {
  height: number;
  duration: number;
  delay: number;
};

/** Hauteurs figées : sans animation, le ruban reste une onde lisible. */
function createBars(phase: number): Bar[] {
  return Array.from({ length: BAR_COUNT }, (_, index) => {
    const primary = Math.sin(index * 0.45 + phase);
    const secondary = Math.sin(index * 0.17 + phase * 1.7);
    const mix = (primary * 0.62 + secondary * 0.38 + 1) / 2;

    return {
      height: Math.round(8 + mix * 20),
      duration: Number((1.8 + ((index * 3 + Math.round(phase * 8)) % 8) * 0.28).toFixed(2)),
      delay: Number((-((index * 0.19 + phase) % 4.8)).toFixed(2)),
    };
  });
}

const leftBars = createBars(0.4);
const rightBars = [...leftBars].reverse().map((bar, index) => ({
  ...bar,
  duration: Number((1.9 + (index % 7) * 0.3).toFixed(2)),
  delay: Number((-((index * 0.23 + 1.4) % 4.8)).toFixed(2)),
}));

export function ScrollCue() {
  return (
    <div className="px-4 py-6 sm:px-6 sm:py-8">
      <div className="flex items-center gap-3 sm:gap-8">
        <WaveBars bars={leftBars} edge="end" />
        <p className="flex shrink-0 flex-col items-center gap-1 text-center text-sm font-medium text-text-secondary">
          Découvrir la solution
          <ChevronDownIcon
            aria-hidden="true"
            className="size-5 motion-safe:animate-landing-float"
          />
        </p>
        <WaveBars bars={rightBars} edge="start" />
      </div>
    </div>
  );
}

function WaveBars({ bars, edge }: { bars: readonly Bar[]; edge: "start" | "end" }) {
  return (
    <div
      aria-hidden="true"
      className={`flex h-9 min-w-0 flex-1 items-center overflow-hidden ${
        edge === "end" ? "justify-end" : "justify-start"
      } ${
        edge === "end"
          ? "[mask-image:linear-gradient(90deg,transparent,black_14%)]"
          : "[mask-image:linear-gradient(270deg,transparent,black_14%)]"
      }`}
    >
      {bars.map((bar, index) => (
        <span
          key={index}
          className="flex h-full min-w-[5px] max-w-[10px] shrink-0 grow basis-[5px] items-center justify-center"
        >
          <span
            className="w-0.5 rounded-full bg-indigo/65 motion-safe:animate-landing-bars dark:bg-apricot/80"
            style={
              {
                height: `${bar.height}px`,
                animationDuration: `${bar.duration}s`,
                animationDelay: `${bar.delay}s`,
              } satisfies CSSProperties
            }
          />
        </span>
      ))}
    </div>
  );
}
