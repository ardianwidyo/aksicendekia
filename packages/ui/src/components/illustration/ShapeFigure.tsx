import React from 'react';

export type NamedShape =
  | 'segitiga'
  | 'segiempat'
  | 'segibanyak'
  | 'lingkaran'
  | 'kubus'
  | 'balok'
  | 'kerucut'
  | 'bola';

export interface ShapeFigureProps {
  title: string;
  shape: NamedShape;
}

const OUTLINE = 'fill-none stroke-primary';
const STROKE_WIDTH = 3;

/** Feature 011 — bangun datar/ruang dasar Kurikulum Merdeka SD (FR-013, elemen Geometri). */
export const ShapeFigure: React.FC<ShapeFigureProps> = ({ title, shape }) => {
  return (
    <svg role="img" aria-label={title} viewBox="0 0 100 100" className="h-auto w-full">
      <title>{title}</title>
      {shape === 'segitiga' && <polygon points="50,10 90,85 10,85" className={OUTLINE} strokeWidth={STROKE_WIDTH} />}
      {shape === 'segiempat' && <rect x={15} y={20} width={70} height={55} className={OUTLINE} strokeWidth={STROKE_WIDTH} />}
      {shape === 'segibanyak' && (
        <polygon points="50,8 88,30 88,70 50,92 12,70 12,30" className={OUTLINE} strokeWidth={STROKE_WIDTH} />
      )}
      {shape === 'lingkaran' && <circle cx={50} cy={50} r={40} className={OUTLINE} strokeWidth={STROKE_WIDTH} />}
      {shape === 'kubus' && (
        <g className={OUTLINE} strokeWidth={STROKE_WIDTH}>
          <rect x={15} y={30} width={50} height={50} />
          <polygon points="15,30 30,15 80,15 65,30" />
          <polygon points="65,30 80,15 80,65 65,80" />
        </g>
      )}
      {shape === 'balok' && (
        <g className={OUTLINE} strokeWidth={STROKE_WIDTH}>
          <rect x={10} y={35} width={60} height={40} />
          <polygon points="10,35 22,20 92,20 70,35" />
          <polygon points="70,35 92,20 92,60 70,75" />
        </g>
      )}
      {shape === 'kerucut' && (
        <g className={OUTLINE} strokeWidth={STROKE_WIDTH}>
          <ellipse cx={50} cy={80} rx={35} ry={10} />
          <path d="M15,80 L50,15 L85,80" />
        </g>
      )}
      {shape === 'bola' && (
        <g className={OUTLINE} strokeWidth={STROKE_WIDTH}>
          <circle cx={50} cy={50} r={40} />
          <ellipse cx={50} cy={50} rx={40} ry={14} />
        </g>
      )}
    </svg>
  );
};
