import React from 'react';

export interface MeasureRulerProps {
  title: string;
  /** Length of the measured object, in the given unit. */
  lengthUnits: number;
  unitLabel: string;
  maxUnits?: number;
}

/** Feature 011 — penggaris berskala untuk elemen Pengukuran (panjang), kelas 1-3. */
export const MeasureRuler: React.FC<MeasureRulerProps> = ({
  title,
  lengthUnits,
  unitLabel,
  maxUnits = Math.ceil(lengthUnits) + 1,
}) => {
  const unitWidth = 30;
  const width = maxUnits * unitWidth + 20;

  return (
    <svg role="img" aria-label={title} viewBox={`0 0 ${width} 50`} className="h-auto w-full">
      <title>{title}</title>
      <line x1={10} y1={15} x2={10 + maxUnits * unitWidth} y2={15} className="stroke-outline" strokeWidth={2} />
      {Array.from({ length: maxUnits + 1 }).map((_, i) => (
        <g key={i}>
          <line x1={10 + i * unitWidth} y1={10} x2={10 + i * unitWidth} y2={20} className="stroke-outline" strokeWidth={1.5} />
          <text x={10 + i * unitWidth} y={30} textAnchor="middle" className="fill-on-surface text-[7px]">
            {i}
          </text>
        </g>
      ))}
      <line
        x1={10}
        y1={5}
        x2={10 + lengthUnits * unitWidth}
        y2={5}
        className="stroke-primary"
        strokeWidth={4}
        strokeLinecap="round"
      />
      <text x={10 + (lengthUnits * unitWidth) / 2} y={45} textAnchor="middle" className="fill-on-surface text-[8px]">
        {lengthUnits} {unitLabel}
      </text>
    </svg>
  );
};
