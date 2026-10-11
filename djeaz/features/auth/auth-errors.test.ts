import { expect, test, vi } from "vitest";

import { classifyAuthResponse, classifyAuthStatus } from "./auth-errors";

test("traduit les échecs Better Auth sans reprendre le message technique", async () => {
  expect(classifyAuthStatus(401, "INVALID_EMAIL_OR_PASSWORD")).toEqual({
    scope: "form",
    message: "Adresse e-mail ou mot de passe incorrect.",
  });
  expect(classifyAuthStatus(422, "USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL")).toEqual({
    scope: "field",
    field: "email",
    message: "Un compte existe déjà avec cette adresse e-mail.",
  });
  expect(classifyAuthStatus(429, undefined)).toEqual({
    scope: "form",
    message: "Trop de tentatives. Réessayez dans quelques instants.",
  });

  const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  const response = new Response(
    JSON.stringify({ message: "select * from users where password = 'secret'", code: "BOOM" }),
    { status: 500 },
  );
  const failure = await classifyAuthResponse(response);

  expect(failure.scope).toBe("form");
  if (failure.scope === "form") {
    expect(failure.message).toMatch(
      /^Une erreur inattendue est survenue\. Réessayez\. Identifiant : [0-9a-f]{16}$/,
    );
    expect(failure.message).not.toContain("select");
    expect(failure.message).not.toContain("secret");
  }
  expect(errorSpy).toHaveBeenCalledOnce();
  expect(String(errorSpy.mock.calls[0]?.[0])).not.toContain("secret");
  errorSpy.mockRestore();
});
