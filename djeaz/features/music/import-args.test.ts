import { expect, test } from "vitest";

import { parseImportArgs } from "./import-args";

test("exige une limite et ne fige aucun genre", () => {
  expect(parseImportArgs([]).ok).toBe(false);

  const parsed = parseImportArgs(["--limit", "3"]);
  expect(parsed).toMatchObject({
    ok: true,
    data: {
      limit: 3,
      artists: 3,
      perArtist: 3,
      global: 3,
      balanceTags: [],
      balancePerTag: 3,
      checkpoint: ".music-import-checkpoint.json",
    },
  });
});

test("accepte une liste de tags fournie au lancement", () => {
  const parsed = parseImportArgs(["--limit", "20", "--balance-tags", "Rock, jazz"]);
  expect(parsed.ok && parsed.data.balanceTags).toEqual(["rock", "jazz"]);
  expect(parseImportArgs(["--limit", "2", "--balance-tags", "mauvais tag!"]).ok).toBe(false);
});
