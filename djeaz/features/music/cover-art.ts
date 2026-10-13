const RELEASE_ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type CoverImage = {
  front?: unknown;
  image?: unknown;
  thumbnails?: unknown;
};

export function coverArtReleaseUrl(releaseId: string): URL {
  return new URL(`https://coverartarchive.org/release/${encodeURIComponent(releaseId)}`);
}

export function isCoverArtArchiveUrl(value: string): boolean {
  return canonicalizeCoverArtUrl(value) !== null;
}

export function canonicalizeCoverArtUrl(value: string): string | null {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return null;
  }

  if (url.username !== "" || url.password !== "") {
    return null;
  }

  if (url.hostname !== "coverartarchive.org") {
    return null;
  }

  if (url.protocol !== "https:" && url.protocol !== "http:") {
    return null;
  }

  url.protocol = "https:";
  return url.toString();
}

function thumbnailFromImage(image: CoverImage): string | null {
  const thumbnails = image.thumbnails;
  if (typeof thumbnails === "object" && thumbnails !== null) {
    for (const key of ["250", "small", "500", "large"]) {
      const candidate = (thumbnails as Record<string, unknown>)[key];
      if (typeof candidate === "string") {
        const canonical = canonicalizeCoverArtUrl(candidate);
        if (canonical) {
          return canonical;
        }
      }
    }
  }

  if (typeof image.image === "string") {
    return canonicalizeCoverArtUrl(image.image);
  }

  return null;
}

export function readCoverArtThumbnailUrl(payload: unknown, releaseId: string): string | null {
  if (!RELEASE_ID_PATTERN.test(releaseId)) {
    return null;
  }

  if (typeof payload !== "object" || payload === null || !("images" in payload)) {
    return null;
  }

  const images = payload.images;
  if (!Array.isArray(images)) {
    return null;
  }

  const typed = images.filter(
    (image): image is CoverImage => typeof image === "object" && image !== null,
  );
  const front = typed.filter((image) => image.front === true);
  const pool = front.length > 0 ? front : typed;

  for (const image of pool) {
    const url = thumbnailFromImage(image);
    if (url) {
      return url;
    }
  }

  if (front.length > 0) {
    return `https://coverartarchive.org/release/${releaseId}/front-250`;
  }

  return null;
}
