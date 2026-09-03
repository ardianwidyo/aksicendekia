'use client';

import React, { useState } from 'react';
import { MediaFallback } from '../MediaFallback';
import {
  IllustrationPrimitiveRenderer,
  hasIllustrationPrimitive,
  type IllustrationPrimitiveRef,
} from '../../illustration/IllustrationPrimitiveRenderer';

export interface IllustrationBlockProps {
  imageUrl: string;
  altText: string;
  caption?: string;
  /** Text explanation shown if the image fails to load (FR-015). */
  fallbackText?: string;
  /**
   * Feature 011 — when set, the concept is drawn by a parametric primitive
   * (an actual number line / array / clock / …) instead of a static SVG file.
   */
  primitive?: IllustrationPrimitiveRef;
}

export const IllustrationBlock: React.FC<IllustrationBlockProps> = ({
  imageUrl,
  altText,
  caption,
  fallbackText,
  primitive,
}) => {
  const [failed, setFailed] = useState(false);

  if (primitive && hasIllustrationPrimitive(primitive.name)) {
    return (
      <figure className="my-2">
        <IllustrationPrimitiveRenderer primitive={primitive} />
        {caption && (
          <figcaption className="mt-1 text-center text-sm text-slate-500">{caption}</figcaption>
        )}
      </figure>
    );
  }

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
