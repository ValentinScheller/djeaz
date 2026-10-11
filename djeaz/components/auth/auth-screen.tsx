"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import { AnimatedMascot, MASCOT_CHARACTER_RATIO } from "@/components/brand/animated-mascot";
import { CredentialsForm } from "@/components/auth/credentials-form";

/** 63 images à 30 i/s ≈ 2,1 s. 1,4× ramène la lecture vers 1,5 s. */
const ESCAPE_PLAYBACK_SPEED = 1.4;
const ESCAPE_WATCHDOG_MS = 4000;

type AuthScreenProps = {
  title: string;
  description: string;
  mode: "sign-in" | "sign-up";
  returnTo?: string;
  alternate: {
    href: string;
    prompt: string;
    label: string;
  };
};

export function AuthScreen({ title, description, mode, returnTo, alternate }: AuthScreenProps) {
  const router = useRouter();
  const [playing, setPlaying] = useState(false);
  const destination = useRef("/dashboard");
  const left = useRef(false);
  const watchdog = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearWatchdog = useCallback(() => {
    if (watchdog.current === null) {
      return;
    }

    clearTimeout(watchdog.current);
    watchdog.current = null;
  }, []);

  const leave = useCallback(() => {
    if (left.current) {
      return;
    }

    left.current = true;
    clearWatchdog();
    router.replace(destination.current);
  }, [clearWatchdog, router]);

  useEffect(() => clearWatchdog, [clearWatchdog]);

  function onAuthenticated(redirectTo: string) {
    destination.current = redirectTo;
    setPlaying(true);
    if (watchdog.current !== null) {
      return;
    }

    watchdog.current = setTimeout(() => {
      watchdog.current = null;
      leave();
    }, ESCAPE_WATCHDOG_MS);
  }

  return (
    <main className="flex w-full min-w-0 flex-1 justify-center px-4 py-8 sm:px-6 sm:py-12">
      <div className="w-full min-w-0 max-w-md rounded-[1.25rem] shadow-public">
        <section className="overflow-hidden rounded-[1.25rem] border border-border bg-surface">
          <div aria-hidden="true" className="h-1.5 bg-indigo dark:bg-apricot" />
          <div className="flex flex-col gap-6 px-4 py-6 sm:px-8 sm:py-8">
            <div className="flex flex-col items-center gap-3 text-center">
              {/*
                Le personnage occupe 61 % du canvas. Le cadre reste w-16 / w-20,
                le player est agrandi et centré pour conserver la taille actuelle.
              */}
              <div className="relative size-16 overflow-hidden sm:size-20">
                <AnimatedMascot
                  alt=""
                  variant="escape"
                  playback={playing ? "once" : "hold"}
                  speed={ESCAPE_PLAYBACK_SPEED}
                  onComplete={leave}
                  onUnavailable={playing ? leave : undefined}
                  className="absolute top-1/2 left-1/2 max-w-none -translate-x-1/2 -translate-y-1/2"
                  style={{ width: `${100 / MASCOT_CHARACTER_RATIO}%` }}
                />
              </div>
              <h1 id="auth-title" className="text-2xl font-semibold wrap-break-word text-text">
                {title}
              </h1>
              <p id="auth-description" className="text-text-secondary wrap-break-word">
                {description}
              </p>
            </div>
            <CredentialsForm mode={mode} returnTo={returnTo} onAuthenticated={onAuthenticated} />
            <p className="text-center text-text-secondary wrap-break-word">
              {alternate.prompt}{" "}
              <Link
                href={alternate.href}
                className="font-medium text-action underline-offset-4 outline-none hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
              >
                {alternate.label}
              </Link>
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
