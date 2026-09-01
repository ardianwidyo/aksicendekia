'use client';

import React, { useState } from 'react';
import { MediaFallback } from '../MediaFallback';

export interface VideoBlockProps {
  title: string;
  videoUrl: string;
  captionUrl: string;
  transcriptText: string;
  fallbackImageUrl?: string;
  fallbackAlt?: string;
}

/**
 * Feature 010 / FR-014. Native <video>, `preload="none"`, NO autoplay, always a
 * caption track. Not populated in v1 (the ANIMATION slot is used instead) but the
 * component exists so a recorded .mp4 can drop in without changing lesson shape.
 */
export const VideoBlock: React.FC<VideoBlockProps> = ({
  title,
  videoUrl,
  captionUrl,
  transcriptText,
  fallbackImageUrl,
  fallbackAlt,
}) => {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <MediaFallback fallbackImageUrl={fallbackImageUrl} fallbackAlt={fallbackAlt} text={transcriptText} />
    );
  }

  return (
    <figure className="my-2">
      <video
        controls
        preload="none"
        onError={() => setFailed(true)}
        className="w-full rounded-xl bg-black"
        aria-label={title}
      >
        <source src={videoUrl} />
        <track kind="captions" src={captionUrl} srcLang="id" label="Bahasa Indonesia" default />
      </video>
      <figcaption className="sr-only">{transcriptText}</figcaption>
    </figure>
  );
};
