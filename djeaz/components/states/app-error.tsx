"use client";

import { useState } from "react";
import Link from "next/link";

import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "cn";

import { createLocalDiagnosticId, readErrorDigest } from "./diagnostic-id";

type AppErrorProps = {
  error: unknown;
  reset: () => void;
};

export function AppError({ error, reset }: AppErrorProps) {
  const [fallbackId] = useState(createLocalDiagnosticId);
  const diagnosticId = readErrorDigest(error) ?? fallbackId;

  return (
    <main className="mx-auto flex min-h-dvh w-full min-w-0 max-w-xl flex-1 flex-col items-center justify-center gap-6 px-4 py-16 text-center">
      <div className="flex w-full min-w-0 flex-col gap-3">
        <h1 className="text-2xl font-semibold text-balance wrap-break-word">
          Une erreur est survenue.
        </h1>
        <p className="text-pretty text-text-secondary wrap-break-word">
          Vous pouvez réessayer. Si cela se reproduit, notez l&apos;identifiant ci-dessous.
        </p>
      </div>
      <p className="flex w-full min-w-0 flex-col gap-1 text-sm text-text-secondary">
        <span>Identifiant de diagnostic</span>
        <span className="font-medium break-all text-text">{diagnosticId}</span>
      </p>
      <div className="flex w-full max-w-full flex-wrap items-center justify-center gap-3">
        <Button type="button" onClick={() => reset()}>
          Réessayer
        </Button>
        <Link href="/" className={cn(buttonVariants({ variant: "outline" }))}>
          Retour à l&apos;accueil
        </Link>
      </div>
    </main>
  );
}
