import "server-only";

import { z } from "zod";

// Le paquet `server-only` ne fournit pas de déclarations de types.
declare module "server-only" {}

const serverEnvKeys = [
  "DATABASE_URL",
  "DATABASE_MIGRATION_URL",
  "BETTER_AUTH_SECRET",
  "BETTER_AUTH_URL",
] as const;

type ServerEnvKey = (typeof serverEnvKeys)[number];

const postgresUrl = z.url({
  protocol: /^postgres(ql)?$/,
});

const serverEnvSchema = z.object({
  DATABASE_URL: postgresUrl,
  DATABASE_MIGRATION_URL: postgresUrl,
  BETTER_AUTH_SECRET: z.string().trim().min(1),
  // `z.httpUrl()` exige un domaine public et refuse `localhost`.
  BETTER_AUTH_URL: z.url({ protocol: /^https?$/ }),
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;

let cachedServerEnv: ServerEnv | undefined;

function readEnv(name: ServerEnvKey): string | undefined {
  // Clé dynamique : Next.js n'inline pas la valeur au build.
  return process.env[name];
}

function invalidServerEnvMessage(error: z.ZodError): string {
  const invalid = new Set<string>();

  for (const issue of error.issues) {
    const key = issue.path[0];
    if (typeof key === "string") {
      invalid.add(key);
    }
  }

  const names = serverEnvKeys.filter((key) => invalid.has(key));
  if (names.length === 0) {
    return "Configuration serveur invalide.";
  }

  return `Configuration serveur invalide : ${names.join(", ")}.`;
}

// Pas de validation à l'import : `next build` ne doit pas exiger ces secrets.
export function getServerEnv(): ServerEnv {
  if (cachedServerEnv) {
    return cachedServerEnv;
  }

  const parsed = serverEnvSchema.safeParse({
    DATABASE_URL: readEnv("DATABASE_URL"),
    DATABASE_MIGRATION_URL: readEnv("DATABASE_MIGRATION_URL"),
    BETTER_AUTH_SECRET: readEnv("BETTER_AUTH_SECRET"),
    BETTER_AUTH_URL: readEnv("BETTER_AUTH_URL"),
  });

  if (!parsed.success) {
    throw new Error(invalidServerEnvMessage(parsed.error));
  }

  cachedServerEnv = parsed.data;
  return cachedServerEnv;
}
