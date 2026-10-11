import { act, fireEvent, render, screen } from "@testing-library/react";
import type { AnchorHTMLAttributes, ReactNode } from "react";
import { beforeEach, expect, test, vi } from "vitest";

import type { CredentialsFormState } from "@/features/auth/form-state";

const replace = vi.hoisted(() => vi.fn());
const signInAction = vi.hoisted(() => vi.fn());
const signUpAction = vi.hoisted(() => vi.fn());

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace }),
}));

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...props
  }: AnchorHTMLAttributes<HTMLAnchorElement> & { href: string; children?: ReactNode }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock("@/features/auth/actions", () => ({
  signInAction,
  signUpAction,
}));

vi.mock("@/components/brand/animated-mascot", () => ({
  MASCOT_CHARACTER_RATIO: 0.61,
  AnimatedMascot: ({
    playback,
    speed,
    onComplete,
    onUnavailable,
  }: {
    playback?: string;
    speed?: number;
    onComplete?: () => void;
    onUnavailable?: () => void;
  }) => (
    <div data-testid="auth-mascot" data-playback={playback} data-speed={String(speed ?? 1)}>
      <button type="button" onClick={onComplete}>
        animation-terminee
      </button>
      <button type="button" onClick={onUnavailable}>
        animation-indisponible
      </button>
    </div>
  ),
}));

import { AuthScreen } from "@/components/auth/auth-screen";

beforeEach(() => {
  replace.mockReset();
  signInAction.mockReset();
  signUpAction.mockReset();
  vi.useRealTimers();
});

const success: CredentialsFormState = {
  fieldErrors: {},
  values: { name: "", email: "dj@example.com" },
  ticket: "authenticated",
  redirectTo: "/dashboard",
};

function renderSignIn() {
  return render(
    <AuthScreen
      mode="sign-in"
      returnTo="/catalog"
      title="Connexion"
      description="Retrouvez vos événements."
      alternate={{
        href: "/sign-up?returnTo=%2Fcatalog",
        prompt: "Pas encore de compte ?",
        label: "Inscription",
      }}
    />,
  );
}

test("le succès lance escape puis navigue à la fin réelle", async () => {
  signInAction.mockResolvedValue(success);

  renderSignIn();

  expect(screen.getByTestId("auth-mascot")).toHaveAttribute("data-playback", "hold");
  fireEvent.change(screen.getByLabelText("Adresse e-mail"), {
    target: { value: "dj@example.com" },
  });
  fireEvent.change(screen.getByLabelText("Mot de passe"), { target: { value: "motdepasse" } });
  fireEvent.click(screen.getByRole("button", { name: "Se connecter" }));

  expect(await screen.findByRole("button", { name: "Connexion réussie…" })).toBeDisabled();
  expect(screen.getByRole("status")).toHaveTextContent("Connexion réussie…");
  expect(screen.getByTestId("auth-mascot")).toHaveAttribute("data-playback", "once");
  expect(screen.getByTestId("auth-mascot")).toHaveAttribute("data-speed", "1.4");
  expect(replace).not.toHaveBeenCalled();

  fireEvent.click(screen.getByRole("button", { name: "animation-terminee" }));

  expect(replace).toHaveBeenCalledTimes(1);
  expect(replace).toHaveBeenCalledWith("/dashboard");
});

test("un catalogue validé par le serveur est la destination de navigation", async () => {
  signInAction.mockResolvedValue({ ...success, redirectTo: "/catalog" });

  renderSignIn();
  fireEvent.change(screen.getByLabelText("Adresse e-mail"), {
    target: { value: "dj@example.com" },
  });
  fireEvent.change(screen.getByLabelText("Mot de passe"), { target: { value: "motdepasse" } });
  fireEvent.click(screen.getByRole("button", { name: "Se connecter" }));

  await screen.findByRole("button", { name: "Connexion réussie…" });
  fireEvent.click(screen.getByRole("button", { name: "animation-terminee" }));

  expect(replace).toHaveBeenCalledTimes(1);
  expect(replace).toHaveBeenCalledWith("/catalog");
});

test("une animation indisponible navigue tout de suite", async () => {
  signInAction.mockResolvedValue({ ...success, redirectTo: "//evil.example" });

  renderSignIn();
  fireEvent.change(screen.getByLabelText("Adresse e-mail"), {
    target: { value: "dj@example.com" },
  });
  fireEvent.change(screen.getByLabelText("Mot de passe"), { target: { value: "motdepasse" } });
  fireEvent.click(screen.getByRole("button", { name: "Se connecter" }));

  await screen.findByRole("button", { name: "Connexion réussie…" });
  fireEvent.click(screen.getByRole("button", { name: "animation-indisponible" }));

  expect(replace).toHaveBeenCalledTimes(1);
  expect(replace).toHaveBeenCalledWith("/dashboard");
});

test("une erreur serveur laisse la mascotte figée", async () => {
  signInAction.mockResolvedValue({
    fieldErrors: {},
    formError: "Trop de tentatives. Réessayez dans quelques instants.",
    values: { name: "", email: "dj@example.com" },
    ticket: "echec",
  } satisfies CredentialsFormState);

  renderSignIn();
  fireEvent.change(screen.getByLabelText("Adresse e-mail"), {
    target: { value: "dj@example.com" },
  });
  fireEvent.change(screen.getByLabelText("Mot de passe"), { target: { value: "motdepasse" } });
  fireEvent.click(screen.getByRole("button", { name: "Se connecter" }));

  expect(await screen.findByRole("alert")).toHaveTextContent(
    "Trop de tentatives. Réessayez dans quelques instants.",
  );
  expect(screen.getByTestId("auth-mascot")).toHaveAttribute("data-playback", "hold");
  expect(replace).not.toHaveBeenCalled();
});

async function authenticate() {
  fireEvent.change(screen.getByLabelText("Adresse e-mail"), {
    target: { value: "dj@example.com" },
  });
  fireEvent.change(screen.getByLabelText("Mot de passe"), { target: { value: "motdepasse" } });
  fireEvent.click(screen.getByRole("button", { name: "Se connecter" }));
  await act(async () => {
    await Promise.resolve();
  });
  expect(screen.getByRole("button", { name: "Connexion réussie…" })).toBeDisabled();
}

test("sans fin d'animation, le filet de 4 secondes navigue une seule fois", async () => {
  vi.useFakeTimers();
  signInAction.mockResolvedValue(success);
  renderSignIn();
  await authenticate();

  act(() => {
    vi.advanceTimersByTime(3999);
  });
  expect(replace).not.toHaveBeenCalled();

  act(() => {
    vi.advanceTimersByTime(1);
  });
  expect(replace).toHaveBeenCalledTimes(1);
  expect(replace).toHaveBeenCalledWith("/dashboard");

  fireEvent.click(screen.getByRole("button", { name: "animation-terminee" }));
  fireEvent.click(screen.getByRole("button", { name: "animation-indisponible" }));
  act(() => {
    vi.advanceTimersByTime(4000);
  });
  expect(replace).toHaveBeenCalledTimes(1);
});

test("la fin réelle annule le filet de sécurité", async () => {
  vi.useFakeTimers();
  signInAction.mockResolvedValue(success);
  renderSignIn();
  await authenticate();

  fireEvent.click(screen.getByRole("button", { name: "animation-terminee" }));
  expect(replace).toHaveBeenCalledTimes(1);

  act(() => {
    vi.advanceTimersByTime(4000);
  });
  expect(replace).toHaveBeenCalledTimes(1);
});

test("une animation indisponible annule le filet de sécurité", async () => {
  vi.useFakeTimers();
  signInAction.mockResolvedValue(success);
  renderSignIn();
  await authenticate();

  fireEvent.click(screen.getByRole("button", { name: "animation-indisponible" }));
  expect(replace).toHaveBeenCalledTimes(1);

  act(() => {
    vi.advanceTimersByTime(4000);
  });
  expect(replace).toHaveBeenCalledTimes(1);
});

test("le démontage annule le filet de sécurité", async () => {
  vi.useFakeTimers();
  signInAction.mockResolvedValue(success);
  const view = renderSignIn();
  await authenticate();

  view.unmount();
  act(() => {
    vi.advanceTimersByTime(4000);
  });
  expect(replace).not.toHaveBeenCalled();
});
