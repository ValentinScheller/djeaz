import { MusicProviderError } from "./types";

type ThrottleOptions = {
  intervalMs: number;
  maxWaiting: number;
};

/**
 * Appels sérialisés et espacés. Au-delà de `maxWaiting` (file + appel en cours),
 * le suivant échoue tout de suite : la file ne grandit pas sans limite.
 */
export function createProviderThrottle(options: ThrottleOptions) {
  let chain: Promise<void> = Promise.resolve();
  let waiting = 0;
  let lastStart = 0;

  return function schedule<T>(task: () => Promise<T>): Promise<T> {
    if (waiting >= options.maxWaiting) {
      return Promise.reject(new MusicProviderError(null));
    }

    waiting += 1;
    const scheduled = chain.then(async () => {
      const delay = options.intervalMs - (Date.now() - lastStart);
      if (delay > 0) {
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
      lastStart = Date.now();
      try {
        return await task();
      } finally {
        waiting -= 1;
      }
    });

    chain = scheduled.then(
      () => undefined,
      () => undefined,
    );

    return scheduled;
  };
}
