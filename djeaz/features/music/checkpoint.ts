import { readFile, rename, writeFile } from "node:fs/promises";

export type ImportCheckpoint = {
  load(): Promise<Set<string>>;
  markDone(recordingMbid: string): Promise<void>;
};

export class ImportCheckpointError extends Error {
  constructor(filePath: string) {
    super(
      `Checkpoint illisible ou invalide (${filePath}). L'import est arrêté. Le fichier n'a pas été modifié.`,
    );
    this.name = "ImportCheckpointError";
  }
}

function nodeCode(error: unknown): string | undefined {
  if (typeof error === "object" && error !== null && "code" in error) {
    return typeof error.code === "string" ? error.code : undefined;
  }
  return undefined;
}

function readDoneIds(raw: string, filePath: string): string[] {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new ImportCheckpointError(filePath);
  }

  if (typeof parsed !== "object" || parsed === null || !("done" in parsed)) {
    throw new ImportCheckpointError(filePath);
  }

  const done = parsed.done;
  if (!Array.isArray(done) || done.some((id) => typeof id !== "string")) {
    throw new ImportCheckpointError(filePath);
  }

  return done;
}

export function createFileCheckpoint(filePath: string): ImportCheckpoint {
  let done: Set<string> | undefined;

  return {
    async load() {
      if (done) {
        return done;
      }

      try {
        const raw = await readFile(filePath, "utf8");
        done = new Set(readDoneIds(raw, filePath));
      } catch (error) {
        if (error instanceof ImportCheckpointError) {
          throw error;
        }
        if (nodeCode(error) === "ENOENT") {
          done = new Set();
          return done;
        }
        throw new ImportCheckpointError(filePath);
      }

      return done;
    },

    async markDone(recordingMbid) {
      const current = await this.load();
      current.add(recordingMbid);
      const payload = JSON.stringify({ version: 1, done: [...current] });
      const temporary = `${filePath}.tmp`;
      await writeFile(temporary, payload);
      await rename(temporary, filePath);
    },
  };
}
