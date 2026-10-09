import { act, render, screen } from "@testing-library/react";
import { useEffect, useRef } from "react";
import { renderToString } from "react-dom/server";
import { beforeEach, expect, test, vi } from "vitest";

import { AnimatedMascot } from "@/components/brand/animated-mascot";

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";
const FLOATY_SRC = "/mascotte-animated-floaty.lottie";
const BACKFLIP_SRC = "/mascotte-animated-backflip.lottie";

type Listener = () => void;

const playerEvents = vi.hoisted(() => ({
  emit: null as ((event: string) => void) | null,
  calls: [] as string[],
}));

vi.mock("@lottiefiles/dotlottie-react", () => ({
  DotLottieReact: ({
    src,
    loop,
    autoplay,
    dotLottieRefCallback,
  }: {
    src?: string;
    loop?: boolean;
    autoplay?: boolean;
    dotLottieRefCallback?: (
      player: {
        isLoaded: boolean;
        totalFrames: number;
        addEventListener: (event: string, listener: Listener) => void;
        removeEventListener: (event: string, listener: Listener) => void;
        pause: () => void;
        play: () => void;
        setFrame: (frame: number) => void;
      } | null,
    ) => void;
  }) => {
    const callbackRef = useRef(dotLottieRefCallback);
    callbackRef.current = dotLottieRefCallback;

    useEffect(() => {
      const listeners = new Map<string, Set<Listener>>();
      callbackRef.current?.({
        isLoaded: false,
        totalFrames: 60,
        addEventListener(event, listener) {
          const group = listeners.get(event) ?? new Set<Listener>();
          group.add(listener);
          listeners.set(event, group);
        },
        removeEventListener(event, listener) {
          listeners.get(event)?.delete(listener);
        },
        pause() {
          playerEvents.calls.push("pause");
        },
        play() {
          playerEvents.calls.push("play");
        },
        setFrame(frame: number) {
          playerEvents.calls.push(`setFrame:${frame}`);
        },
      });
      playerEvents.emit = (event) => {
        listeners.get(event)?.forEach((listener) => listener());
      };

      return () => {
        callbackRef.current?.(null);
        playerEvents.emit = null;
      };
    }, []);

    return (
      <div
        data-testid="dotlottie"
        data-src={src}
        data-loop={String(loop)}
        data-autoplay={String(autoplay)}
      />
    );
  },
}));

type MediaListener = (event: MediaQueryListEvent) => void;

function installReducedMotion(matches: boolean) {
  const listeners = new Set<MediaListener>();
  const media = {
    matches,
    media: REDUCED_MOTION_QUERY,
    addEventListener(_type: string, listener: MediaListener) {
      listeners.add(listener);
    },
    removeEventListener(_type: string, listener: MediaListener) {
      listeners.delete(listener);
    },
  };

  vi.stubGlobal("matchMedia", (query: string) => {
    if (query !== REDUCED_MOTION_QUERY) {
      return {
        matches: false,
        media: query,
        addEventListener() {},
        removeEventListener() {},
      };
    }

    return media;
  });

  return {
    setMatches(next: boolean) {
      media.matches = next;
      for (const listener of listeners) {
        listener({ matches: next, media: media.media } as MediaQueryListEvent);
      }
    },
  };
}

beforeEach(() => {
  playerEvents.emit = null;
  playerEvents.calls = [];
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

test("le premier rendu serveur reste la mascotte statique", () => {
  const html = renderToString(<AnimatedMascot alt="Célébration" />);

  expect(html).toContain("/mascotte.svg");
  expect(html).not.toContain(FLOATY_SRC);
  expect(html).not.toContain(BACKFLIP_SRC);
  expect(html).not.toContain("mascotte-animated-happy.mp4");
  expect(html).not.toContain("dotlottie");
  expect(html).toContain('aria-label="Célébration"');
});

test("reduced-motion conserve la statique et n'initialise pas le player", () => {
  installReducedMotion(true);

  const { rerender } = render(<AnimatedMascot />);

  expect(screen.queryByTestId("dotlottie")).not.toBeInTheDocument();
  expect(document.body.innerHTML).not.toContain(FLOATY_SRC);
  expect(document.querySelector("img")).toHaveAttribute("src", "/mascotte.svg");
  expect(document.querySelector("img")).toHaveAttribute("alt", "");
  expect(screen.queryByRole("img")).not.toBeInTheDocument();

  rerender(<AnimatedMascot variant="backflip" startDelay={1000} endDelay={1000} />);

  expect(screen.queryByTestId("dotlottie")).not.toBeInTheDocument();
  expect(document.body.innerHTML).not.toContain(BACKFLIP_SRC);
  expect(document.querySelector("img")).toHaveAttribute("src", "/mascotte.svg");
});

test("le player Lottie n'apparaît que lorsque le mouvement est permis", () => {
  const motion = installReducedMotion(true);

  render(<AnimatedMascot alt="Célébration" />);
  expect(screen.queryByTestId("dotlottie")).not.toBeInTheDocument();

  act(() => motion.setMatches(false));

  const player = screen.getByTestId("dotlottie");
  expect(player).toHaveAttribute("data-src", FLOATY_SRC);
  expect(player).toHaveAttribute("data-loop", "true");
  expect(player).toHaveAttribute("data-autoplay", "true");
  expect(screen.getAllByRole("img", { name: "Célébration" })).toHaveLength(1);
  expect(document.querySelector("img")).toHaveAttribute("src", "/mascotte.svg");
  expect(document.querySelector("img")).toHaveAttribute("alt", "");

  act(() => motion.setMatches(true));

  expect(screen.queryByTestId("dotlottie")).not.toBeInTheDocument();
  expect(document.body.innerHTML).not.toContain(FLOATY_SRC);
  expect(document.querySelector("img")).toHaveAttribute("src", "/mascotte.svg");
});

test("un échec de chargement conserve la mascotte statique", () => {
  installReducedMotion(false);

  render(<AnimatedMascot />);
  expect(screen.getByTestId("dotlottie")).toBeInTheDocument();

  act(() => playerEvents.emit?.("loadError"));

  expect(screen.queryByTestId("dotlottie")).not.toBeInTheDocument();
  expect(document.querySelector("img")).toHaveAttribute("src", "/mascotte.svg");
});

test("floaty est la variante par défaut et backflip pointe vers son fichier", () => {
  installReducedMotion(false);

  const { rerender } = render(<AnimatedMascot />);
  expect(screen.getByTestId("dotlottie")).toHaveAttribute("data-src", FLOATY_SRC);
  expect(screen.getByTestId("dotlottie")).toHaveAttribute("data-loop", "true");

  rerender(<AnimatedMascot variant="backflip" />);
  expect(screen.getByTestId("dotlottie")).toHaveAttribute("data-src", BACKFLIP_SRC);
  expect(screen.getByTestId("dotlottie")).toHaveAttribute("data-loop", "true");
});

test("sans délai, la boucle native ne programme aucune pause", () => {
  vi.useFakeTimers();
  installReducedMotion(false);

  render(<AnimatedMascot startDelay={0} endDelay={0} />);

  const player = screen.getByTestId("dotlottie");
  expect(player).toHaveAttribute("data-loop", "true");
  expect(player).toHaveAttribute("data-autoplay", "true");

  act(() => playerEvents.emit?.("load"));
  act(() => playerEvents.emit?.("complete"));
  act(() => {
    vi.advanceTimersByTime(5000);
  });

  expect(playerEvents.calls).toEqual([]);
});

test("startDelay retarde la première lecture et endDelay le cycle suivant", () => {
  vi.useFakeTimers();
  installReducedMotion(false);

  render(<AnimatedMascot variant="backflip" startDelay={1000} endDelay={1000} />);

  const player = screen.getByTestId("dotlottie");
  expect(player).toHaveAttribute("data-src", BACKFLIP_SRC);
  expect(player).toHaveAttribute("data-loop", "false");
  expect(player).toHaveAttribute("data-autoplay", "false");
  expect(playerEvents.calls).toEqual([]);

  act(() => playerEvents.emit?.("load"));
  expect(playerEvents.calls).toEqual(["pause", "setFrame:0"]);

  act(() => {
    vi.advanceTimersByTime(999);
  });
  expect(playerEvents.calls).toEqual(["pause", "setFrame:0"]);

  act(() => {
    vi.advanceTimersByTime(1);
  });
  expect(playerEvents.calls).toEqual(["pause", "setFrame:0", "play"]);

  act(() => playerEvents.emit?.("complete"));
  expect(playerEvents.calls).toEqual(["pause", "setFrame:0", "play", "pause", "setFrame:59"]);

  act(() => {
    vi.advanceTimersByTime(999);
  });
  expect(playerEvents.calls).toEqual(["pause", "setFrame:0", "play", "pause", "setFrame:59"]);

  act(() => {
    vi.advanceTimersByTime(1);
  });
  expect(playerEvents.calls).toEqual([
    "pause",
    "setFrame:0",
    "play",
    "pause",
    "setFrame:59",
    "setFrame:0",
    "pause",
  ]);

  act(() => {
    vi.advanceTimersByTime(999);
  });
  expect(playerEvents.calls.filter((call) => call === "play")).toHaveLength(1);

  act(() => {
    vi.advanceTimersByTime(1);
  });
  expect(playerEvents.calls.filter((call) => call === "play")).toHaveLength(2);
});

test("le démontage annule les pauses de début et de fin", () => {
  vi.useFakeTimers();
  installReducedMotion(false);

  const start = render(<AnimatedMascot variant="backflip" startDelay={1000} endDelay={1000} />);
  act(() => playerEvents.emit?.("load"));
  start.unmount();

  act(() => {
    vi.advanceTimersByTime(1000);
  });
  expect(playerEvents.calls).toEqual(["pause", "setFrame:0"]);

  playerEvents.calls = [];
  const end = render(<AnimatedMascot variant="backflip" startDelay={1000} endDelay={1000} />);
  act(() => playerEvents.emit?.("load"));
  act(() => {
    vi.advanceTimersByTime(1000);
  });
  act(() => playerEvents.emit?.("complete"));
  end.unmount();

  act(() => {
    vi.advanceTimersByTime(2000);
  });
  expect(playerEvents.calls).toEqual(["pause", "setFrame:0", "play", "pause", "setFrame:59"]);
});

test("un changement de variante annule la pause en cours", () => {
  vi.useFakeTimers();
  installReducedMotion(false);

  const { rerender } = render(
    <AnimatedMascot variant="backflip" startDelay={1000} endDelay={1000} />,
  );
  act(() => playerEvents.emit?.("load"));
  rerender(<AnimatedMascot variant="floaty" />);

  act(() => {
    vi.advanceTimersByTime(1000);
  });
  expect(playerEvents.calls).toEqual(["pause", "setFrame:0"]);
  expect(screen.getByTestId("dotlottie")).toHaveAttribute("data-src", FLOATY_SRC);
});

test("reduced-motion annule les pauses et retire le player", () => {
  vi.useFakeTimers();
  const motion = installReducedMotion(false);

  render(<AnimatedMascot variant="backflip" startDelay={1000} endDelay={1000} />);
  act(() => playerEvents.emit?.("load"));
  act(() => motion.setMatches(true));

  act(() => {
    vi.advanceTimersByTime(2000);
  });
  expect(playerEvents.calls).toEqual(["pause", "setFrame:0"]);
  expect(screen.queryByTestId("dotlottie")).not.toBeInTheDocument();
  expect(document.querySelector("img")).toHaveAttribute("src", "/mascotte.svg");
});
