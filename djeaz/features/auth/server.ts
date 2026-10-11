import "server-only";

import { betterAuth } from "better-auth/minimal";
import { drizzleAdapter } from "better-auth/adapters/drizzle";

import { getServerEnv } from "@/lib/env.server";

import { PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH } from "./password-policy";

let authPromise: ReturnType<typeof createAuth> | undefined;

async function createAuth() {
  const env = getServerEnv();
  const origin = new URL(env.BETTER_AUTH_URL).origin;
  const [{ db }, tables] = await Promise.all([import("@/db/client.server"), import("@/db/schema")]);

  return betterAuth({
    secret: env.BETTER_AUTH_SECRET,
    baseURL: env.BETTER_AUTH_URL,
    trustedOrigins: [origin],
    database: drizzleAdapter(db, {
      provider: "pg",
      schema: {
        user: tables.user,
        session: tables.session,
        account: tables.account,
        verification: tables.verification,
        rateLimit: tables.rateLimit,
      },
    }),
    emailAndPassword: {
      enabled: true,
      disableSignUp: false,
      requireEmailVerification: false,
      minPasswordLength: PASSWORD_MIN_LENGTH,
      maxPasswordLength: PASSWORD_MAX_LENGTH,
    },
    // Seuils laissés aux défauts 1.7.7 (fenêtre 10 s, max 100, règles spéciales).
    // `enabled` est forcé : la bibliothèque ne l'active que si NODE_ENV vaut
    // `production` au chargement du module, donc pas sous Vitest ni en développement.
    rateLimit: {
      enabled: true,
      storage: "database",
    },
    // `false` explicite : en NODE_ENV=test, Better Auth saute sinon le contrôle d'origine.
    // CSRF reste au défaut (actif). `useSecureCookies` reste indéfini : Secure suit l'URL.
    advanced: {
      disableOriginCheck: false,
    },
  });
}

function getAuth(): ReturnType<typeof createAuth> {
  authPromise ??= createAuth().catch((error: unknown) => {
    authPromise = undefined;
    throw error;
  });
  return authPromise;
}

// Instanciation au premier appel : l'import ne lit pas les secrets.
export const auth = {
  handler(request: Request): Promise<Response> {
    return getAuth().then((instance) => instance.handler(request));
  },
  // Lecture directe de l'API serveur. `disableCookieCache` ignore un éventuel
  // cache signé : seule la session en base autorise.
  getSession(requestHeaders: Headers) {
    return getAuth().then((instance) =>
      instance.api.getSession({
        headers: requestHeaders,
        query: { disableCookieCache: true },
      }),
    );
  },
};
