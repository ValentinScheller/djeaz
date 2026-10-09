"use client";

import { DotLottieReact, type DotLottie } from "@lottiefiles/dotlottie-react";
import { cn } from "cn";
import { useCallback, useEffect, useRef, useState } from "react";

import { Mascot } from "@/components/brand/mascot";

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

/**
 * Chaque fichier .lottie place la couche « mascotte » à 61 % d'une
 * composition 800×800, environ 1,15 % sous le centre. Le SVG statique
 * remplit tout son cadre : on reprend ce cadrage pour éviter le saut
 * au chargement du premier frame.
 */
const STATIC_FALLBACK_SCALE = "origin-center scale-[61%] translate-y-[1.15%]";

const MASCOT_ANIMATIONS = {
  floaty: "/mascotte-animated-floaty.lottie",
  backflip: "/mascotte-animated-backflip.lottie",
  explode: "/mascotte-animated-explode.lottie",
  escape: "/mascotte-animated-escape.lottie",
  trampoline: "/mascotte-animated-trampoline.lottie",
} as const;

type AnimatedMascotVariant = keyof typeof MASCOT_ANIMATIONS;

type AnimatedMascotProps = {
  /** Vide : décorative. Renseigné seulement si l'animation porte une information. */
  alt?: string;
  className?: string;
  /** Animation officielle. `floaty` boucle naturellement. */
  variant?: AnimatedMascotVariant;
  /** Maintien de la première frame avant la lecture, en millisecondes. */
  startDelay?: number;
  /** Maintien de la dernière frame avant le retour au début, en millisecondes. */
  endDelay?: number;
};

export function AnimatedMascot({
  alt = "",
  className,
  variant = "floaty",
  startDelay = 0,
  endDelay = 0,
}: AnimatedMascotProps) {
  const [allowMotion, setAllowMotion] = useState(false);
  const [animationReady, setAnimationReady] = useState(false);
  const [animationFailed, setAnimationFailed] = useState(false);
  const unbindPlayer = useRef<(() => void) | null>(null);
  const phaseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startDelayRef = useRef(startDelay);
  const endDelayRef = useRef(endDelay);
  const labelled = alt.length > 0;
  const showPlayer = allowMotion && !animationFailed;
  const src = MASCOT_ANIMATIONS[variant];
  const paced = startDelay > 0 || endDelay > 0;

  useEffect(() => {
    startDelayRef.current = startDelay;
    endDelayRef.current = endDelay;
  }, [startDelay, endDelay]);

  const clearPhaseTimer = useCallback(() => {
    if (phaseTimer.current !== null) {
      clearTimeout(phaseTimer.current);
      phaseTimer.current = null;
    }
  }, []);

  const schedulePhase = useCallback(
    (delay: number, run: () => void) => {
      clearPhaseTimer();
      if (delay <= 0) {
        run();
        return;
      }

      phaseTimer.current = setTimeout(() => {
        phaseTimer.current = null;
        run();
      }, delay);
    },
    [clearPhaseTimer],
  );

  useEffect(() => {
    if (typeof window.matchMedia !== "function") {
      return;
    }

    const media = window.matchMedia(REDUCED_MOTION_QUERY);

    function sync() {
      const allowed = !media.matches;
      setAllowMotion(allowed);
      if (!allowed) {
        clearPhaseTimer();
        setAnimationReady(false);
        setAnimationFailed(false);
      }
    }

    sync();
    media.addEventListener("change", sync);
    return () => {
      media.removeEventListener("change", sync);
      clearPhaseTimer();
    };
  }, [clearPhaseTimer]);

  const onPlayer = useCallback(
    (player: DotLottie | null) => {
      unbindPlayer.current?.();
      unbindPlayer.current = null;
      clearPhaseTimer();

      if (!player) {
        return;
      }

      let opened = false;
      const showFirstFrame = () => {
        if (opened) {
          return;
        }
        opened = true;
        setAnimationReady(true);
        if (startDelayRef.current <= 0) {
          return;
        }

        // pause conserve la frame. stop() la ramènerait au début après un seek.
        player.pause();
        player.setFrame(0);
        schedulePhase(startDelayRef.current, () => {
          player.play();
        });
      };
      const fail = () => {
        clearPhaseTimer();
        setAnimationReady(false);
        setAnimationFailed(true);
      };
      const holdLastFrame = () => {
        if (startDelayRef.current <= 0 && endDelayRef.current <= 0) {
          return;
        }

        player.pause();
        player.setFrame(Math.max(0, player.totalFrames - 1));
        schedulePhase(endDelayRef.current, () => {
          player.setFrame(0);
          if (startDelayRef.current > 0) {
            player.pause();
          }
          schedulePhase(startDelayRef.current, () => {
            player.play();
          });
        });
      };

      player.addEventListener("load", showFirstFrame);
      player.addEventListener("loadError", fail);
      player.addEventListener("renderError", fail);
      player.addEventListener("complete", holdLastFrame);
      unbindPlayer.current = () => {
        clearPhaseTimer();
        player.removeEventListener("load", showFirstFrame);
        player.removeEventListener("loadError", fail);
        player.removeEventListener("renderError", fail);
        player.removeEventListener("complete", holdLastFrame);
      };

      if (player.isLoaded) {
        showFirstFrame();
      }
    },
    [clearPhaseTimer, schedulePhase],
  );

  return (
    <span
      className={cn("relative inline-block aspect-square w-60 max-w-full", className)}
      {...(labelled ? { role: "img" as const, "aria-label": alt } : {})}
    >
      <Mascot
        alt=""
        sizes="15rem"
        className={cn(
          "absolute inset-0 size-full object-contain",
          STATIC_FALLBACK_SCALE,
          animationReady && "invisible",
        )}
      />
      {showPlayer ? (
        <DotLottieReact
          key={variant}
          src={src}
          loop={!paced}
          autoplay={startDelay <= 0}
          aria-hidden
          dotLottieRefCallback={onPlayer}
          className={cn("absolute inset-0 size-full", animationReady ? "visible" : "invisible")}
        />
      ) : null}
    </span>
  );
}
