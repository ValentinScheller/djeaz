import type { ReactNode } from "react";

import { Mascot } from "@/components/brand/mascot";
import { cn } from "cn";

type EmptyStateProps = {
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
};

export function EmptyState({ title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn("flex w-full min-w-0 flex-col items-center gap-4 py-8 text-center", className)}
    >
      <Mascot className="w-32 sm:w-40" />
      <div className="flex w-full min-w-0 max-w-prose flex-col gap-2">
        <h2 className="text-xl font-semibold text-balance wrap-break-word">{title}</h2>
        {description ? (
          <p className="text-pretty text-text-secondary wrap-break-word">{description}</p>
        ) : null}
      </div>
      {action}
    </div>
  );
}
