import React from 'react';

export interface PlaceValueBlocksProps {
  title: string;
  thousands?: number;
  hundreds?: number;
  tens?: number;
  ones?: number;
}

const COLUMN_STYLE: Record<'thousands' | 'hundreds' | 'tens' | 'ones', string> = {
  thousands: 'fill-tertiary',
  hundreds: 'fill-secondary',
  tens: 'fill-primary',
  ones: 'fill-on-surface-variant',
};

/**
 * Feature 011 — nilai tempat sebagai kolom balok bertumpuk, satu kolom per
 * kelompok (ribuan/ratusan/puluhan/satuan). viewBox-responsive: skala
 * mengikuti lebar wadahnya, bukan piksel tetap (FR-040, FR-041).
 */
export const PlaceValueBlocks: React.FC<PlaceValueBlocksProps> = ({
  title,
  thousands = 0,
  hundreds = 0,
  tens = 0,
  ones = 0,
}) => {
  const allColumns: Array<{ key: keyof typeof COLUMN_STYLE; count: number }> = [
    { key: 'thousands', count: thousands },
    { key: 'hundreds', count: hundreds },
    { key: 'tens', count: tens },
    { key: 'ones', count: ones },
  ];
  const columns = allColumns.filter((c) => c.count > 0);

  const colWidth = 100 / Math.max(columns.length, 1);
  const maxCount = Math.max(1, ...columns.map((c) => c.count));

  return (
    <svg role="img" aria-label={title} viewBox="0 0 200 120" className="h-auto w-full">
      <title>{title}</title>
      {columns.map((col, colIndex) => {
        const x = colIndex * colWidth * 2 + 10;
        return (
          <g key={col.key}>
            {Array.from({ length: Math.min(col.count, 20) }).map((_, i) => (
              <rect
                key={i}
                x={x}
                y={100 - (i + 1) * (90 / maxCount)}
                width={colWidth * 1.6}
                height={90 / maxCount - 2}
                rx={2}
                className={COLUMN_STYLE[col.key]}
              />
            ))}
            <text x={x + (colWidth * 1.6) / 2} y={112} textAnchor="middle" className="fill-on-surface text-[8px]">
              {col.count}
            </text>
          </g>
        );
      })}
    </svg>
  );
};
