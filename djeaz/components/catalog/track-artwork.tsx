"use client";

import { MusicIcon } from "lucide-react";
import { useState } from "react";

import { canonicalizeCoverArtUrl, isCoverArtArchiveUrl } from "@/features/music/cover-art";

type TrackArtworkProps = {
  url: string | null;
};

export function TrackArtwork({ url }: TrackArtworkProps) {
  const canonical = url && isCoverArtArchiveUrl(url) ? canonicalizeCoverArtUrl(url) : null;
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const visible = canonical !== null && failedUrl !== canonical;

  if (!visible || !canonical) {
    return (
      <span
        aria-hidden
        className="inline-flex size-12 shrink-0 items-center justify-center rounded-lg bg-accent text-text"
      >
        <MusicIcon className="size-5" />
      </span>
    );
  }

  return (
    // P2.9 stocke une URL Cover Art Archive. next/image la téléchargerait et la mettrait en cache.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={canonical}
      alt=""
      width={48}
      height={48}
      className="size-12 shrink-0 rounded-lg object-cover"
      onError={() => setFailedUrl(canonical)}
    />
  );
}
