import React from 'react';

export interface FractionShapeProps {
  title: string;
  numerator: number;
  denominator: number;
  shape?: 'circle' | 'bar';
}

/**
 * Feature 011 — a fraction shown as a shaded circle or bar. The interactive
 * counterpart (`FractionBarBuilder`) lets a student build one; this
 * illustration primitive is for the concept-walkthrough segment.
 */
export const FractionShape: React.FC<FractionShapeProps> = ({
  title,
  numerator,
  denominator,
  shape = 'circle',
}) => {
  if (shape === 'bar') {
    const segmentWidth = 180 / Math.max(denominator, 1);
    return (
      <svg role="img" aria-label={title} viewBox="0 0 200 60" className="h-auto w-full">
        <title>{title}</title>
        {Array.from({ length: denominator }).map((_, i) => (
          <rect
            key={i}
            x={10 + i * segmentWidth}
            y={10}
            width={segmentWidth - 2}
            height={40}
            className={i < numerator ? 'fill-primary' : 'fill-surface-container'}
            stroke="currentColor"
            strokeOpacity={0.2}
          />
        ))}
      </svg>
    );
  }

  const radius = 45;
  const cx = 50;
  const cy = 50;
  const anglePerSlice = (2 * Math.PI) / Math.max(denominator, 1);

  return (
    <svg role="img" aria-label={title} viewBox="0 0 100 100" className="h-auto w-full">
      <title>{title}</title>
      {Array.from({ length: denominator }).map((_, i) => {
        const startAngle = i * anglePerSlice - Math.PI / 2;
        const endAngle = startAngle + anglePerSlice;
        const x1 = cx + radius * Math.cos(startAngle);
        const y1 = cy + radius * Math.sin(startAngle);
        const x2 = cx + radius * Math.cos(endAngle);
        const y2 = cy + radius * Math.sin(endAngle);
        const largeArc = anglePerSlice > Math.PI ? 1 : 0;
        return (
          <path
            key={i}
            d={`M${cx},${cy} L${x1},${y1} A${radius},${radius} 0 ${largeArc} 1 ${x2},${y2} Z`}
            className={i < numerator ? 'fill-primary' : 'fill-surface-container'}
            stroke="currentColor"
            strokeOpacity={0.2}
          />
        );
      })}
    </svg>
  );
};
