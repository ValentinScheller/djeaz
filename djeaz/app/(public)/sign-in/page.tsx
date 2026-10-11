import type { Metadata } from "next";

import { AuthScreen } from "@/components/auth/auth-screen";
import { CredentialsForm } from "@/components/auth/credentials-form";
import {
  authPagePath,
  readReturnToParam,
  redirectAuthenticatedToDashboard,
} from "@/features/auth/session.server";

export const metadata: Metadata = {
  title: "Connexion",
};

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ returnTo?: string | string[] }>;
}) {
  await redirectAuthenticatedToDashboard();

  const params = await searchParams;
  const returnTo = readReturnToParam(params.returnTo);

  return (
    <AuthScreen
      title="Connexion"
      description="Retrouvez vos événements et préparez votre prochaine soirée."
      alternate={{
        href: authPagePath("/sign-up", returnTo),
        prompt: "Pas encore de compte ?",
        label: "Inscription",
      }}
    >
      <CredentialsForm mode="sign-in" returnTo={returnTo} />
    </AuthScreen>
  );
}
