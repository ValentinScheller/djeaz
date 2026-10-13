import "server-only";

import { PROVIDER_MAX_WAITING, PROVIDER_MIN_INTERVAL_MS } from "./limits";
import { createProviderThrottle } from "./throttle";

/** Un seul rythme pour MusicBrainz, Cover Art Archive et ListenBrainz, par processus. */
export const scheduleProviderCall = createProviderThrottle({
  intervalMs: PROVIDER_MIN_INTERVAL_MS,
  maxWaiting: PROVIDER_MAX_WAITING,
});
