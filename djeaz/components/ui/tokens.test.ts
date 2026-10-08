import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { expect, test } from "vitest";

const css = readFileSync(
  path.join(path.dirname(fileURLToPath(import.meta.url)), "../../app/globals.css"),
  "utf8",
);

test("les variables shadcn aliasent les tokens DJEAZ", () => {
  expect(css).toContain("--background: var(--djeaz-background)");
  expect(css).toContain("--foreground: var(--djeaz-text)");
  expect(css).toContain("--primary: var(--djeaz-action)");
  expect(css).toContain("--primary-foreground: var(--djeaz-action-foreground)");
  expect(css).toContain("--destructive: var(--djeaz-error)");
  expect(css).toContain("--ring: var(--djeaz-focus)");
  expect(css).toContain("--radius: var(--djeaz-radius-field)");
  expect(css).toContain("--radius-xl: var(--djeaz-radius-card)");
  expect(css).toContain("--font-sans: var(--font-plus-jakarta-sans)");
  expect(css).toContain("--djeaz-indigo: #5755c9");
  expect(css).toContain("--djeaz-control-size: 2.75rem");
  expect(css).toContain("--djeaz-control-size: 2.5rem");
  expect(css).toContain('[data-intensity="dashboard"]');
  expect(css).not.toMatch(/oklch\(/);
  expect(css).not.toContain("Geist");
});
