import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "cn";

type SkeletonProps = {
  className?: string;
};

type CardListSkeletonProps = SkeletonProps & {
  count?: number;
};

export function PageSkeleton({ className }: SkeletonProps) {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label="Chargement…"
      className={cn("flex w-full min-w-0 flex-col gap-6", className)}
    >
      <div aria-hidden="true" className="flex min-w-0 flex-col gap-3">
        <Skeleton className="h-8 w-48 max-w-full" />
        <Skeleton className="h-4 w-full max-w-xl" />
        <Skeleton className="h-4 w-4/5 max-w-lg" />
        <Skeleton className="mt-2 h-40 w-full rounded-xl" />
      </div>
    </div>
  );
}

export function CardListSkeleton({ count = 3, className }: CardListSkeletonProps) {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label="Chargement…"
      className={cn("w-full min-w-0", className)}
    >
      <ul aria-hidden="true" className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {Array.from({ length: count }, (_, index) => (
          <li
            key={index}
            className="flex min-w-0 flex-col gap-3 rounded-xl border border-border bg-surface p-4 shadow-raised"
          >
            <Skeleton className="h-5 w-2/3 max-w-full" />
            <Skeleton className="h-4 w-24 max-w-full" />
            <Skeleton className="h-4 w-full" />
          </li>
        ))}
      </ul>
    </div>
  );
}
