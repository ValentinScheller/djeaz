"use server";

import { headers } from "next/headers";
import { redirect, RedirectType } from "next/navigation";

import {
  classifyAuthResponse,
  classifyThrownAuthError,
  failureState,
  unexpectedAuthState,
} from "./auth-errors";
import { parseSignIn, parseSignUp } from "./credentials";
import {
  initialCredentialsState,
  type CredentialsFormState,
  type CredentialsValues,
  type SignOutState,
} from "./form-state";
import { safeReturnPath } from "./session.server";
import { auth } from "./server";

async function sessionResponse(
  request: Promise<Response>,
  values: CredentialsValues,
): Promise<Response | CredentialsFormState> {
  try {
    return await request;
  } catch (error) {
    const classified = classifyThrownAuthError(error);
    if (classified) {
      return failureState(classified, values);
    }

    return unexpectedAuthState(error, values);
  }
}

async function rejectResponse(
  response: Response,
  values: CredentialsValues,
): Promise<CredentialsFormState | undefined> {
  if (response.ok) {
    return undefined;
  }

  return failureState(await classifyAuthResponse(response), values);
}

async function hasSessionToken(response: Response): Promise<boolean> {
  try {
    const body = (await response.json()) as { token?: unknown };
    return typeof body.token === "string" && body.token.length > 0;
  } catch {
    return false;
  }
}

function authenticatedState(redirectTo: string, values: CredentialsValues): CredentialsFormState {
  return {
    fieldErrors: {},
    values,
    ticket: "authenticated",
    redirectTo,
  };
}

export async function signUpAction(
  _previous: CredentialsFormState,
  formData: FormData,
): Promise<CredentialsFormState> {
  const parsed = parseSignUp(formData);
  if (!parsed.ok) {
    return parsed.state;
  }

  const requestHeaders = await headers();
  const response = await sessionResponse(
    auth.signUpEmail({
      name: parsed.data.name,
      artistName: parsed.data.artistName,
      email: parsed.data.email,
      password: parsed.data.password,
      requestHeaders,
    }),
    parsed.values,
  );

  if (!(response instanceof Response)) {
    return response;
  }

  const rejected = await rejectResponse(response, parsed.values);
  if (rejected) {
    return rejected;
  }

  if (!(await hasSessionToken(response))) {
    return unexpectedAuthState(new Error("MissingSession"), parsed.values);
  }

  return authenticatedState("/dashboard", parsed.values);
}

export async function signInAction(
  _previous: CredentialsFormState,
  formData: FormData,
): Promise<CredentialsFormState> {
  const parsed = parseSignIn(formData);
  if (!parsed.ok) {
    return parsed.state;
  }

  const requestHeaders = await headers();
  const response = await sessionResponse(
    auth.signInEmail({
      email: parsed.data.email,
      password: parsed.data.password,
      requestHeaders,
    }),
    parsed.values,
  );

  if (!(response instanceof Response)) {
    return response;
  }

  const rejected = await rejectResponse(response, parsed.values);
  if (rejected) {
    return rejected;
  }

  if (!(await hasSessionToken(response))) {
    return unexpectedAuthState(new Error("MissingSession"), parsed.values);
  }

  return authenticatedState(safeReturnPath(parsed.returnTo), parsed.values);
}

export async function signOutAction(): Promise<SignOutState> {
  const requestHeaders = await headers();
  let response: Response;

  try {
    response = await auth.signOut(requestHeaders);
  } catch (error) {
    const classified = classifyThrownAuthError(error);
    return {
      formError:
        classified?.message ?? unexpectedAuthState(error, initialCredentialsState.values).formError,
    };
  }

  if (!response.ok) {
    const failure = await classifyAuthResponse(response);
    return { formError: failure.message };
  }

  redirect("/sign-in", RedirectType.replace);
}
