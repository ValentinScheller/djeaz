import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { afterEach, expect, test } from "vitest";

import { createFileCheckpoint, ImportCheckpointError } from "./checkpoint";

const directories: string[] = [];

afterEach(async () => {
  await Promise.all(
    directories.splice(0).map((directory) => rm(directory, { recursive: true, force: true })),
  );
});

test("reprend les identifiants déjà écrits", async () => {
  const directory = await mkdtemp(path.join(tmpdir(), "djeaz-import-"));
  directories.push(directory);
  const filePath = path.join(directory, "checkpoint.json");
  const checkpoint = createFileCheckpoint(filePath);

  expect([...(await checkpoint.load())]).toEqual([]);
  await checkpoint.markDone("aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa");
  await checkpoint.markDone("bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb");

  const reloaded = createFileCheckpoint(filePath);
  expect([...(await reloaded.load())].sort()).toEqual([
    "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
    "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
  ]);

  const raw = await readFile(filePath, "utf8");
  expect(raw).not.toMatch(/postgres/i);
});

test("un checkpoint absent démarre vide, un fichier invalide arrête sans l'écraser", async () => {
  const directory = await mkdtemp(path.join(tmpdir(), "djeaz-import-"));
  directories.push(directory);
  const missing = path.join(directory, "absent.json");
  expect([...(await createFileCheckpoint(missing).load())]).toEqual([]);

  const corrupt = path.join(directory, "corrompu.json");
  const payload = "{ pas du json";
  await writeFile(corrupt, payload);

  await expect(createFileCheckpoint(corrupt).load()).rejects.toBeInstanceOf(ImportCheckpointError);
  expect(await readFile(corrupt, "utf8")).toBe(payload);

  const invalid = path.join(directory, "invalide.json");
  const invalidPayload = JSON.stringify({ done: [1] });
  await writeFile(invalid, invalidPayload);
  await expect(createFileCheckpoint(invalid).load()).rejects.toBeInstanceOf(ImportCheckpointError);
  expect(await readFile(invalid, "utf8")).toBe(invalidPayload);
});
