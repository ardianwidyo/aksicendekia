import React from 'react';

export interface NumberLineStripProps {
  title: string;
  min: number;
  max: number;
  step?: number;
  /** Values to mark with a filled dot, e.g. the answer or a worked-example step. */
  highlightValues?: number[];
}

/**
 * Feature 011 — a static number-line diagram (the interactive counterpart is
 * `NumberLineExplorer` in components/interactive/). viewBox-responsive so it
 * remains legible at 320px without page-level horizontal scroll (FR-041) —
 * callers wrap it in `ScrollableWide` when the tick count is large.
 */
export const NumberLineStrip: React.FC<NumberLineStripProps> = ({
  title,
  min,
  max,
  step = 1,
  highlightValues = [],
}) => {
  const ticks = Math.round((max - min) / step);
  const width = 100 + ticks * 40;
  const xFor = (value: number) => 20 + ((value - min) / step) * 40;

  return (
    <svg role="img" aria-label={title} viewBox={`0 0 ${width} 60`} className="h-auto w-full">
      <title>{title}</title>
      <line x1={10} y1={30} x2={width - 10} y2={30} className="stroke-outline" strokeWidth={2} />
      {Array.from({ length: ticks + 1 }).map((_, i) => {
        const value = min + i * step;
        const x = xFor(value);
        const highlighted = highlightValues.includes(value);
        return (
          <g key={value}>
            <line x1={x} y1={24} x2={x} y2={36} className="stroke-outline" strokeWidth={2} />
            {highlighted && <circle cx={x} cy={30} r={6} className="fill-primary" />}
            <text x={x} y={50} textAnchor="middle" className="fill-on-surface text-[8px]">
              {value}
            </text>
          </g>
        );
      })}
    </svg>
  );
};
