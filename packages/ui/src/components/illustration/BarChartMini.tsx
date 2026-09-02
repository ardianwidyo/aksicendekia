import React from 'react';

export interface BarChartMiniProps {
  title: string;
  data: Array<{ label: string; value: number }>;
}

/** Feature 011 — diagram batang sederhana (elemen Analisis Data dan Peluang, FR-013). */
export const BarChartMini: React.FC<BarChartMiniProps> = ({ title, data }) => {
  const barWidth = 24;
  const gap = 12;
  const width = data.length * (barWidth + gap) + gap;
  const maxValue = Math.max(1, ...data.map((d) => d.value));
  const chartHeight = 80;

  return (
    <svg role="img" aria-label={title} viewBox={`0 0 ${width} 110`} className="h-auto w-full">
      <title>{title}</title>
      <line x1={4} y1={90} x2={width - 4} y2={90} className="stroke-outline" strokeWidth={1} />
      {data.map((d, i) => {
        const barHeight = (d.value / maxValue) * chartHeight;
        const x = gap + i * (barWidth + gap);
        return (
          <g key={d.label}>
            <rect x={x} y={90 - barHeight} width={barWidth} height={barHeight} className="fill-primary" rx={2} />
            <text x={x + barWidth / 2} y={102} textAnchor="middle" className="fill-on-surface text-[8px]">
              {d.label}
            </text>
            <text x={x + barWidth / 2} y={90 - barHeight - 4} textAnchor="middle" className="fill-on-surface text-[8px]">
              {d.value}
            </text>
          </g>
        );
      })}
    </svg>
  );
};
