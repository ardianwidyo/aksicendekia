import React from 'react';

export interface ClockFaceProps {
  title: string;
  hour: number;
  minute: number;
}

/** Feature 011 — jam analog untuk elemen Pengukuran (waktu), kelas 1-4. */
export const ClockFace: React.FC<ClockFaceProps> = ({ title, hour, minute }) => {
  const hourAngle = ((hour % 12) + minute / 60) * 30 - 90;
  const minuteAngle = minute * 6 - 90;
  const hourEnd = { x: 50 + 22 * Math.cos((hourAngle * Math.PI) / 180), y: 50 + 22 * Math.sin((hourAngle * Math.PI) / 180) };
  const minuteEnd = {
    x: 50 + 34 * Math.cos((minuteAngle * Math.PI) / 180),
    y: 50 + 34 * Math.sin((minuteAngle * Math.PI) / 180),
  };

  return (
    <svg role="img" aria-label={title} viewBox="0 0 100 100" className="h-auto w-full">
      <title>{title}</title>
      <circle cx={50} cy={50} r={45} className="fill-surface-container stroke-outline" strokeWidth={2} />
      {Array.from({ length: 12 }).map((_, i) => {
        const angle = (i * 30 * Math.PI) / 180;
        const x = 50 + 38 * Math.sin(angle);
        const y = 50 - 38 * Math.cos(angle);
        return (
          <text key={i} x={x} y={y + 3} textAnchor="middle" className="fill-on-surface text-[7px]">
            {i === 0 ? 12 : i}
          </text>
        );
      })}
      <line x1={50} y1={50} x2={hourEnd.x} y2={hourEnd.y} className="stroke-on-surface" strokeWidth={4} strokeLinecap="round" />
      <line x1={50} y1={50} x2={minuteEnd.x} y2={minuteEnd.y} className="stroke-primary" strokeWidth={2.5} strokeLinecap="round" />
      <circle cx={50} cy={50} r={3} className="fill-on-surface" />
    </svg>
  );
};
