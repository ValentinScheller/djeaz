"use client";

import { DotLottieReact, type DotLottie } from "@lottiefiles/dotlottie-react";
import { cn } from "cn";
import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";

import { Mascot } from "@/components/brand/mascot";

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

/**
 * Chaque fichier .lottie place la couche « mascotte » à 61 % d'une
 * composition 800×800, environ 1,15 % sous le centre. Le SVG statique
 * remplit tout son cadre : on reprend ce cadrage pour éviter le saut
 * au chargement du premier frame.
 */
export const MASCOT_CHARACTER_RATIO = 0.61;
const STATIC_FALLBACK_SCALE = "origin-center scale-[61%] translate-y-[1.15%]";

const MASCOT_ANIMATIONS = {
  floaty: "/mascotte-animated-floaty.lottie",
  backflip: "/mascotte-animated-backflip.lottie",
  explode: "/mascotte-animated-explode.lottie",
  escape: "/mascotte-animated-escape.lottie",
  trampoline: "/mascotte-animated-trampoline.lottie",
} as const;

type AnimatedMascotVariant = keyof typeof MASCOT_ANIMATIONS;
type AnimatedMascotPlayback = "auto" | "hold" | "once";

type AnimatedMascotProps = {
  /** Vide : décorative. Renseigné seulement si l'animation porte une information. */
  alt?: string;
  className?: string;
  style?: CSSProperties;
  /** Animation officielle. `floaty` boucle naturellement. */
  variant?: AnimatedMascotVariant;
  /** Maintien de la première frame avant la lecture, en millisecondes. */
  startDelay?: number;
  /** Maintien de la dernière frame avant le retour au début, en millisecondes. */
  endDelay?: number;
  /**
   * `auto` conserve la lecture actuelle. `hold` fige la première frame.
   * `once` joue une seule fois, sans boucle ni délai.
   */
  playback?: AnimatedMascotPlayback;
  /** Fin réelle d'une lecture `once`. */
  onComplete?: () => void;
  /** Lecture `once` impossible : mouvement réduit ou player en échec. */
  onUnavailable?: () => void;
  /** Multiplicateur de lecture. `1` conserve le rythme du fichier. */
  speed?: number;
};

export function AnimatedMascot({
  alt = "",
  className,
  style,
  variant = "floaty",
  startDelay = 0,
  endDelay = 0,
  playback = "auto",
  onComplete,
  onUnavailable,
  speed = 1,
}: AnimatedMascotProps) {
  const [allowMotion, setAllowMotion] = useState<boolean | null>(null);
  const [animationReady, setAnimationReady] = useState(false);
  const [animationFailed, setAnimationFailed] = useState(false);
  const unbindPlayer = useRef<(() => void) | null>(null);
  const phaseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const playerRef = useRef<DotLottie | null>(null);
  const startDelayRef = useRef(startDelay);
  const endDelayRef = useRef(endDelay);
  const playbackRef = useRef(playback);
  const onCompleteRef = useRef(onComplete);
  const onUnavailableRef = useRef(onUnavailable);
  const speedRef = useRef(speed);
  const outcome = useRef<"complete" | "unavailable" | null>(null);
  const labelled = alt.length > 0;
  const manual = playback === "hold" || playback === "once";
  const showPlayer = allowMotion === true && !animationFailed;
  const src = MASCOT_ANIMATIONS[variant];
  const paced = !manual && (startDelay > 0 || endDelay > 0);

  useEffect(() => {
    startDelayRef.current = startDelay;
    endDelayRef.current = endDelay;
    playbackRef.current = playback;
    onCompleteRef.current = onComplete;
    onUnavailableRef.current = onUnavailable;
    speedRef.current = speed;
  });

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

  const signalComplete = useCallback(() => {
    if (outcome.current || playbackRef.current !== "once") {
      return;
    }

    outcome.current = "complete";
    onCompleteRef.current?.();
  }, []);

  const signalUnavailable = useCallback(() => {
    if (outcome.current || playbackRef.current !== "once") {
      return;
    }

    outcome.current = "unavailable";
    onUnavailableRef.current?.();
  }, []);

  useEffect(() => {
    function applyMotion(allowed: boolean) {
      setAllowMotion(allowed);
      if (!allowed) {
        clearPhaseTimer();
        setAnimationReady(false);
        setAnimationFailed(false);
      }
    }

    if (typeof window.matchMedia !== "function") {
      applyMotion(false);
      return;
    }

    const media = window.matchMedia(REDUCED_MOTION_QUERY);

    function sync() {
      applyMotion(!media.matches);
    }

    sync();
    media.addEventListener("change", sync);
    return () => {
      media.removeEventListener("change", sync);
      clearPhaseTimer();
    };
  }, [clearPhaseTimer]);

  useEffect(() => {
    if (playback !== "once" || allowMotion === null || outcome.current) {
      return;
    }

    if (!allowMotion || animationFailed) {
      signalUnavailable();
      return;
    }

    if (!animationReady || !playerRef.current) {
      return;
    }

    try {
      if (speedRef.current !== 1) {
        playerRef.current.setSpeed(speedRef.current);
      }
      playerRef.current.play();
    } catch {
      signalUnavailable();
    }
  }, [allowMotion, animationFailed, animationReady, playback, signalUnavailable]);

  const onPlayer = useCallback(
    (player: DotLottie | null) => {
      unbindPlayer.current?.();
      unbindPlayer.current = null;
      clearPhaseTimer();
      playerRef.current = player;

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
        const mode = playbackRef.current;
        if (mode === "hold" || (mode === "auto" && startDelayRef.current > 0)) {
          // pause conserve la frame. stop() la ramènerait au début après un seek.
          player.pause();
          player.setFrame(0);
        }
        if (mode !== "auto" || startDelayRef.current <= 0) {
          return;
        }

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
        if (playbackRef.current === "once") {
          signalComplete();
          return;
        }

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
    [clearPhaseTimer, schedulePhase, signalComplete],
  );

  return (
    <span
      className={cn("relative inline-block aspect-square w-60 max-w-full", className)}
      style={style}
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
          loop={!manual && !paced}
          autoplay={!manual && startDelay <= 0}
          aria-hidden
          dotLottieRefCallback={onPlayer}
          className={cn("absolute inset-0 size-full", animationReady ? "visible" : "invisible")}
        />
      ) : null}
    </span>
  );
}
