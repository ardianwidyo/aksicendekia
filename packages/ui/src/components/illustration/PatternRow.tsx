import React from 'react';

export type PatternShapeId = 'circle' | 'square' | 'triangle' | 'star';

export interface PatternRowProps {
  title: string;
  /** The sequence so far, e.g. ['circle', 'square', 'circle', 'square']. */
  items: PatternShapeId[];
  /** Index the student should fill in / that is being asked about. */
  highlightIndex?: number;
}

const SHAPE_FILL: Record<PatternShapeId, string> = {
  circle: 'fill-primary',
  square: 'fill-secondary',
  triangle: 'fill-tertiary',
  star: 'fill-error',
};

function renderShape(shape: PatternShapeId, cx: number, cy: number, size: number, className: string) {
  switch (shape) {
    case 'circle':
      return <circle cx={cx} cy={cy} r={size / 2} className={className} />;
    case 'square':
      return <rect x={cx - size / 2} y={cy - size / 2} width={size} height={size} className={className} />;
    case 'triangle':
      return (
        <polygon
          points={`${cx},${cy - size / 2} ${cx + size / 2},${cy + size / 2} ${cx - size / 2},${cy + size / 2}`}
          className={className}
        />
      );
    case 'star':
      return <polygon points={starPoints(cx, cy, size / 2, size / 4)} className={className} />;
  }
}

function starPoints(cx: number, cy: number, outerR: number, innerR: number): string {
  const points: string[] = [];
  for (let i = 0; i < 10; i++) {
    const r = i % 2 === 0 ? outerR : innerR;
    const angle = (Math.PI / 5) * i - Math.PI / 2;
    points.push(`${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`);
  }
  return points.join(' ');
}

/** Feature 011 — pola bentuk berulang (elemen Aljabar, "pola bilangan dan gambar"). */
export const PatternRow: React.FC<PatternRowProps> = ({ title, items, highlightIndex }) => {
  const cell = 30;
  const width = items.length * cell + cell;

  return (
    <svg role="img" aria-label={title} viewBox={`0 0 ${width} 40`} className="h-auto w-full">
      <title>{title}</title>
      {items.map((shape, i) => {
        const cx = cell / 2 + i * cell + cell / 2;
        const highlighted = i === highlightIndex;
        return (
          <g key={i}>
            {highlighted && (
              <rect x={cx - cell / 2 + 2} y={4} width={cell - 4} height={32} rx={4} className="fill-none stroke-primary" strokeDasharray="3 2" />
            )}
            {renderShape(shape, cx, 20, 16, SHAPE_FILL[shape])}
          </g>
        );
      })}
    </svg>
  );
};
