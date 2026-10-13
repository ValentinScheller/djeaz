const TAG_PATTERN = /^[a-z0-9][a-z0-9 -]{0,39}$/i;

export type ImportArgs = {
  limit: number;
  artists: number;
  perArtist: number;
  global: number;
  balanceTags: string[];
  balancePerTag: number;
  checkpoint: string;
};

const USAGE =
  "Usage : pnpm music:import --limit N [--artists N] [--per-artist N] [--global N] [--balance-tags a,b] [--balance-per-tag N] [--checkpoint fichier]";

function readValue(argv: string[], name: string): string | undefined {
  const index = argv.indexOf(name);
  if (index === -1) {
    return undefined;
  }
  return argv[index + 1];
}

function positiveInt(value: string | undefined, label: string, max: number): number | string {
  if (value === undefined) {
    return `Option ${label} manquante.`;
  }
  if (!/^[0-9]+$/.test(value)) {
    return `Option ${label} invalide.`;
  }
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < 1 || parsed > max) {
    return `Option ${label} invalide.`;
  }
  return parsed;
}

export function parseImportArgs(
  argv: string[],
): { ok: true; data: ImportArgs } | { ok: false; message: string } {
  if (argv.includes("--help")) {
    return { ok: false, message: USAGE };
  }

  const limitResult = positiveInt(readValue(argv, "--limit"), "--limit", 100_000);
  if (typeof limitResult === "string") {
    return { ok: false, message: `${limitResult} ${USAGE}` };
  }

  const artistsValue = readValue(argv, "--artists");
  const perArtistValue = readValue(argv, "--per-artist");
  const globalValue = readValue(argv, "--global");
  const balancePerTagValue = readValue(argv, "--balance-per-tag");

  const artists =
    artistsValue === undefined
      ? Math.min(10, limitResult)
      : positiveInt(artistsValue, "--artists", 500);
  const perArtist =
    perArtistValue === undefined
      ? Math.min(5, limitResult)
      : positiveInt(perArtistValue, "--per-artist", 100);
  const globalCount =
    globalValue === undefined
      ? Math.min(10, limitResult)
      : positiveInt(globalValue, "--global", 1_000);
  const balancePerTag =
    balancePerTagValue === undefined
      ? Math.min(5, limitResult)
      : positiveInt(balancePerTagValue, "--balance-per-tag", 25);

  for (const result of [artists, perArtist, globalCount, balancePerTag]) {
    if (typeof result === "string") {
      return { ok: false, message: `${result} ${USAGE}` };
    }
  }

  const tagsValue = readValue(argv, "--balance-tags");
  const balanceTags =
    tagsValue === undefined || tagsValue.trim() === ""
      ? []
      : tagsValue.split(",").map((tag) => tag.trim().toLowerCase());

  if (balanceTags.length > 20 || balanceTags.some((tag) => !TAG_PATTERN.test(tag))) {
    return { ok: false, message: `Option --balance-tags invalide. ${USAGE}` };
  }

  const checkpoint = readValue(argv, "--checkpoint") ?? ".music-import-checkpoint.json";
  if (checkpoint.startsWith("-") || checkpoint.includes("\0")) {
    return { ok: false, message: `Option --checkpoint invalide. ${USAGE}` };
  }

  return {
    ok: true,
    data: {
      limit: limitResult,
      artists: artists as number,
      perArtist: perArtist as number,
      global: globalCount as number,
      balanceTags,
      balancePerTag: balancePerTag as number,
      checkpoint,
    },
  };
}
