import React from 'react';

export interface ArrayGridProps {
  title: string;
  rows: number;
  cols: number;
}

/**
 * Feature 011 — rows x cols array of dots, the standard visual model for
 * multiplication/division (e.g. "3 baris x 4 kolom = 12").
 */
export const ArrayGrid: React.FC<ArrayGridProps> = ({ title, rows, cols }) => {
  const cell = 16;
  const width = cols * cell + cell;
  const height = rows * cell + cell;

  return (
    <svg role="img" aria-label={title} viewBox={`0 0 ${width} ${height}`} className="h-auto w-full">
      <title>{title}</title>
      {Array.from({ length: rows }).map((_, r) =>
        Array.from({ length: cols }).map((_, c) => (
          <circle
            key={`${r}-${c}`}
            cx={cell / 2 + c * cell + cell / 2}
            cy={cell / 2 + r * cell + cell / 2}
            r={cell / 3}
            className="fill-primary"
          />
        )),
      )}
    </svg>
  );
};
