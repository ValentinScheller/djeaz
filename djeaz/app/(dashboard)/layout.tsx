import type { ReactNode } from "react";

import { DashboardShell } from "@/components/layout/dashboard-shell";
import type { DashboardUserIdentity } from "@/components/layout/dashboard-user-menu";
import { getAuthenticatedSession, type CurrentSession } from "@/features/auth/session.server";

/** Champs publics déjà présents sur la session. Le nom / prénom privé reste serveur. */
function dashboardIdentity(session: CurrentSession): DashboardUserIdentity {
  return {
    artistName: session.user.artistName,
    email: session.user.email,
  };
}

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const result = await getAuthenticatedSession();

  // Chaque page privée redirige elle-même. Sans session, aucune identité n'est affichée.
  if (!result.ok) {
    return children;
  }

  return <DashboardShell user={dashboardIdentity(result.data)}>{children}</DashboardShell>;
}
