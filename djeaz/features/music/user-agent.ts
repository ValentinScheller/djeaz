const USER_AGENT_PATTERN =
  /^[A-Za-z0-9][A-Za-z0-9 ._+/-]*\/[0-9]+(?:\.[0-9]+){1,2} \([^)\r\n]{3,120}\)$/;

export function readMusicBrainzUserAgent(
  env: Record<string, string | undefined> = process.env,
): string {
  const value = env.MUSICBRAINZ_USER_AGENT?.trim() ?? "";

  if (!USER_AGENT_PATTERN.test(value)) {
    throw new Error(
      "MUSICBRAINZ_USER_AGENT invalide. Format attendu : Application/version ( contact ).",
    );
  }

  return value;
}
