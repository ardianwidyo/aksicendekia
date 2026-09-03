'use client';

import React from 'react';
import { PlaceValueBlocks } from './PlaceValueBlocks';
import { NumberLineStrip } from './NumberLineStrip';
import { FractionShape } from './FractionShape';
import { ArrayGrid } from './ArrayGrid';
import { ShapeFigure } from './ShapeFigure';
import { BarChartMini } from './BarChartMini';
import { ClockFace } from './ClockFace';
import { MoneyStack } from './MoneyStack';
import { PatternRow } from './PatternRow';
import { MeasureRuler } from './MeasureRuler';

export interface IllustrationPrimitiveRef {
  name: string;
  props: Record<string, unknown>;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const REGISTRY: Record<string, React.ComponentType<any>> = {
  PlaceValueBlocks,
  NumberLineStrip,
  FractionShape,
  ArrayGrid,
  ShapeFigure,
  BarChartMini,
  ClockFace,
  MoneyStack,
  PatternRow,
  MeasureRuler,
};

/**
 * Feature 011 — renders one of the 10 viewBox-responsive illustration primitives
 * from a `{ name, props }` descriptor authored in content-kit. Returns null for
 * an unknown name so the caller can fall back to its static image.
 */
export const IllustrationPrimitiveRenderer: React.FC<{ primitive: IllustrationPrimitiveRef }> = ({
  primitive,
}) => {
  const Component = REGISTRY[primitive.name];
  if (!Component) return null;
  return (
    <div className="mx-auto max-w-md">
      <Component {...primitive.props} />
    </div>
  );
};

export function hasIllustrationPrimitive(name: string): boolean {
  return name in REGISTRY;
}
