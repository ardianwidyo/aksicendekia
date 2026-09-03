import React from 'react';

export interface MoneyStackProps {
  title: string;
  denominations: Array<{ value: number; count: number }>;
}

function formatRupiah(value: number): string {
  return `Rp${value.toLocaleString('id-ID')}`;
}

/** Feature 011 — tumpukan nominal uang untuk elemen Aljabar/Bilangan (kelas 2-4, konteks uang). */
export const MoneyStack: React.FC<MoneyStackProps> = ({ title, denominations }) => {
  return (
    <svg
      role="img"
      aria-label={title}
      viewBox={`0 0 ${denominations.length * 60} 100`}
      className="h-auto w-full"
    >
      <title>{title}</title>
      {denominations.map((d, colIndex) => {
        const x = colIndex * 60 + 5;
        return (
          <g key={d.value}>
            {Array.from({ length: Math.min(d.count, 8) }).map((_, i) => (
              <rect
                key={i}
                x={x}
                y={78 - i * 9}
                width={50}
                height={16}
                rx={2}
                className="fill-tertiary stroke-on-tertiary"
                strokeWidth={0.5}
              />
            ))}
            <text x={x + 25} y={95} textAnchor="middle" className="fill-on-surface text-[8px]">
              {formatRupiah(d.value)} x{d.count}
            </text>
          </g>
        );
      })}
    </svg>
  );
};
