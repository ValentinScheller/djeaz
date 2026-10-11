import "server-only";

import { parseSetCookieHeader, toCookieOptions } from "better-auth/cookies/utils";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { betterAuth } from "better-auth/minimal";
import { cookies } from "next/headers";

import { getServerEnv } from "@/lib/env.server";

import { artistNameSchema } from "./credentials";
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
    // Clé `artistName` = propriété Drizzle. Ne pas définir `fieldName` :
    // l'adaptateur l'utiliserait comme clé de schéma au lieu de `artistName`.
    // Trim et bornes : validateur Standard Schema (Zod), avant enregistrement.
    user: {
      additionalFields: {
        artistName: {
          type: "string",
          required: true,
          validator: {
            input: artistNameSchema,
          },
        },
      },
    },
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
  // `auth.api.*` court-circuite le limiteur du routeur. `handler` reste en processus :
  // ce n'est pas un appel HTTP vers `/api/auth`, et les seuils 1.7.7 s'appliquent.
  signUpEmail(input: {
    name: string;
    artistName: string;
    email: string;
    password: string;
    requestHeaders: Headers;
  }) {
    return postAuth("/sign-up/email", input.requestHeaders, {
      name: input.name,
      artistName: input.artistName,
      email: input.email,
      password: input.password,
    });
  },
  signInEmail(input: { email: string; password: string; requestHeaders: Headers }) {
    return postAuth("/sign-in/email", input.requestHeaders, {
      email: input.email,
      password: input.password,
    });
  },
  signOut(requestHeaders: Headers) {
    return postAuth("/sign-out", requestHeaders, {});
  },
};

async function applyAuthCookies(response: Response): Promise<void> {
  const cookieStore = await cookies();

  for (const header of response.headers.getSetCookie()) {
    for (const [name, attributes] of parseSetCookieHeader(header)) {
      if (!name) {
        continue;
      }

      cookieStore.set(name, attributes.value, toCookieOptions(attributes));
    }
  }
}

async function postAuth(
  path: "/sign-up/email" | "/sign-in/email" | "/sign-out",
  requestHeaders: Headers,
  body: Record<string, unknown>,
): Promise<Response> {
  const env = getServerEnv();
  const headers = new Headers(requestHeaders);
  headers.set("content-type", "application/json");
  headers.delete("content-length");

  const response = await getAuth().then((instance) =>
    instance.handler(
      new Request(new URL(`/api/auth${path}`, env.BETTER_AUTH_URL), {
        method: "POST",
        headers,
        body: JSON.stringify(body),
      }),
    ),
  );

  await applyAuthCookies(response);
  return response;
}
