"use client";

import { useState } from "react";

/**
 * Click-to-load embed for a publicly shared Google Drive video.
 *
 * The iframe is only mounted after the reader presses play, so Google's player
 * scripts and cookies never load for people who don't watch it, and the page
 * stays fast. Before that it is just our own poster image. A direct link is
 * always available as a fallback in case the Drive share ever changes.
 */
export default function DriveVideo({
  fileId,
  poster,
  title,
  caption,
}: {
  fileId: string;
  poster: string;
  title: string;
  caption?: React.ReactNode;
}) {
  const [playing, setPlaying] = useState(false);
  const watchUrl = `https://drive.google.com/file/d/${fileId}/view`;

  return (
    <figure className="my-8 overflow-hidden rounded-xl border border-line bg-surface-2">
      <div className="relative aspect-video bg-bg">
        {playing ? (
          <iframe
            src={`https://drive.google.com/file/d/${fileId}/preview`}
            title={title}
            allow="autoplay; fullscreen"
            allowFullScreen
            className="absolute inset-0 h-full w-full"
          />
        ) : (
          <button
            onClick={() => setPlaying(true)}
            aria-label={`Play video: ${title}`}
            className="group absolute inset-0 h-full w-full cursor-pointer"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={poster}
              alt=""
              className="absolute inset-0 h-full w-full object-cover opacity-70 transition-opacity group-hover:opacity-85"
            />
            <span className="absolute inset-0 flex flex-col items-center justify-center gap-3">
              <span className="flex size-16 items-center justify-center rounded-full bg-blue/90 shadow-lg transition-transform group-hover:scale-105">
                <svg
                  viewBox="0 0 24 24"
                  className="ml-1 size-7 fill-white"
                  aria-hidden
                >
                  <path d="M8 5v14l11-7z" />
                </svg>
              </span>
              <span className="rounded-full bg-bg/80 px-3 py-1 text-xs text-ink">
                {title}
              </span>
            </span>
          </button>
        )}
      </div>
      <figcaption className="flex flex-wrap items-baseline gap-x-3 gap-y-1 border-t border-line px-4 py-3 text-[11px] leading-relaxed text-ink-3">
        {caption ? <span className="flex-1">{caption}</span> : null}
        <a
          href={watchUrl}
          target="_blank"
          rel="noreferrer"
          className="shrink-0 text-blue underline"
        >
          Open on Google Drive
        </a>
      </figcaption>
    </figure>
  );
}
