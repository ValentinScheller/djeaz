import { expect, test } from "vitest";

import { readMusicBrainzUserAgent } from "./user-agent";

test("accepte un User-Agent avec contact et refuse le reste sans le répéter", () => {
  const valid = "DJEAZ/0.1.0 (https://djeaz.com)";
  expect(readMusicBrainzUserAgent({ MUSICBRAINZ_USER_AGENT: valid })).toBe(valid);

  const secret = "contact-secret-ne-doit-pas-fuir";
  let message = "";
  try {
    readMusicBrainzUserAgent({ MUSICBRAINZ_USER_AGENT: secret });
  } catch (error) {
    message = error instanceof Error ? error.message : "";
  }

  expect(message).toMatch(/MUSICBRAINZ_USER_AGENT invalide/);
  expect(message).not.toContain(secret);
  expect(() => readMusicBrainzUserAgent({})).toThrow(/invalide/);
});
