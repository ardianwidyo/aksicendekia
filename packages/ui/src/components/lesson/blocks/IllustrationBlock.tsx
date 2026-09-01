'use client';

import React, { useState } from 'react';
import { MediaFallback } from '../MediaFallback';

export interface IllustrationBlockProps {
  imageUrl: string;
  altText: string;
  caption?: string;
  /** Text explanation shown if the image fails to load (FR-015). */
  fallbackText?: string;
}

export const IllustrationBlock: React.FC<IllustrationBlockProps> = ({
  imageUrl,
  altText,
  caption,
  fallbackText,
}) => {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return <MediaFallback text={fallbackText ?? altText} />;
  }

  return (
    <figure className="my-2">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={imageUrl}
        alt={altText}
        onError={() => setFailed(true)}
        className="mx-auto max-h-72 rounded-xl"
      />
      {caption && <figcaption className="mt-1 text-center text-sm text-slate-500">{caption}</figcaption>}
    </figure>
  );
};
