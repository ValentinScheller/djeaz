import { expect, test } from "vitest";

import { createProviderThrottle } from "./throttle";
import { MusicProviderError } from "./types";

test("sérialise les départs et refuse une file pleine", async () => {
  const schedule = createProviderThrottle({ intervalMs: 40, maxWaiting: 2 });
  const started: number[] = [];

  const first = schedule(async () => {
    started.push(Date.now());
  });
  const second = schedule(async () => {
    started.push(Date.now());
  });
  const blocked = createProviderThrottle({ intervalMs: 50, maxWaiting: 1 });
  const hanging = blocked(() => new Promise<void>(() => undefined));
  await expect(blocked(async () => undefined)).rejects.toBeInstanceOf(MusicProviderError);
  void hanging;

  await first;
  await second;
  expect(started).toHaveLength(2);
  expect(started[1]! - started[0]!).toBeGreaterThanOrEqual(35);
});
