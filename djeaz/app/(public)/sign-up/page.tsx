import type { Metadata } from "next";

import { AuthScreen } from "@/components/auth/auth-screen";
import { CredentialsForm } from "@/components/auth/credentials-form";
import {
  authPagePath,
  readReturnToParam,
  redirectAuthenticatedToDashboard,
} from "@/features/auth/session.server";

export const metadata: Metadata = {
  title: "Inscription",
};

export default async function SignUpPage({
  searchParams,
}: {
  searchParams: Promise<{ returnTo?: string | string[] }>;
}) {
  await redirectAuthenticatedToDashboard();

  const params = await searchParams;
  const returnTo = readReturnToParam(params.returnTo);

  return (
    <AuthScreen
      title="Inscription"
      description="Créez votre espace DJ pour préparer vos événements."
      alternate={{
        href: authPagePath("/sign-in", returnTo),
        prompt: "Déjà un compte ?",
        label: "Connexion",
      }}
    >
      <CredentialsForm mode="sign-up" />
    </AuthScreen>
  );
}
