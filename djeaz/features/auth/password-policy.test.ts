import { expect, test } from "vitest";

import { PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH } from "./password-policy";

test("reprend les bornes officielles Better Auth 1.7.7", () => {
  expect(PASSWORD_MIN_LENGTH).toBe(8);
  expect(PASSWORD_MAX_LENGTH).toBe(128);
});
