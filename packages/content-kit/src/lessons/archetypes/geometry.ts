import type { InteractiveLesson, LessonQuestionInput } from '../types.js';
import {
  ArchetypeSpecBase,
  assembleLesson,
  assetKey,
  at,
  buildStandardBlocks,
  distinctNumericOptions,
  dragGroupQuestion,
  idNum,
  isYoungGrade,
  mcQuestion,
  numberLineQuestion,
  shortAnswerQuestion,
  toOptions,
} from './shared.js';

const OPTLET = (j: number): string => (['a', 'b', 'c', 'd', 'e'][j] ?? 'x');

/**
 * `geometry` archetype — plane/solid shapes, their properties, perimeter and
 * area. Widget: IMAGE_HOTSPOT. Kelas 1-6.
 */
export interface GeometryLessonSpec extends ArchetypeSpecBase {
  params: {
    shapes: Array<{ name: string; sides: number; vertices: number }>;
    /** [width, height] rectangles for perimeter/area questions (kelas 4+). */
    rects?: Array<[number, number]>;
  };
}

type NamedShape = 'segitiga' | 'segiempat' | 'segibanyak' | 'lingkaran' | 'kubus' | 'balok' | 'kerucut' | 'bola';

/** Map an authoring shape name to the closest `ShapeFigure` primitive shape. */
function toNamedShape(name: string): NamedShape {
  const n = name.toLowerCase();
  if (n.includes('lingkaran')) return 'lingkaran';
  if (n.includes('segitiga') && (n.includes('prisma') || n.includes('limas'))) return 'balok';
  if (n.includes('segitiga')) return 'segitiga';
  if (n.includes('kubus')) return 'kubus';
  if (n.includes('balok') || n.includes('limas') || n.includes('prisma')) return 'balok';
  if (n.includes('kerucut')) return 'kerucut';
  if (n.includes('bola')) return 'bola';
  if (n.includes('segi ') || n.includes('segibanyak') || n.includes('segi lima') || n.includes('segi enam')) {
    return 'segibanyak';
  }
  // persegi, persegi panjang, jajar genjang, trapesium, belah ketupat, ...
  return 'segiempat';
}

export function makeGeometryLesson(spec: GeometryLessonSpec): InteractiveLesson {
  const { gradeLevel: grade } = spec;
  const { shapes } = spec.params;
  if (shapes.length < 4) throw new Error(`${spec.id}: geometry butuh >= 4 bangun.`);
  const rects = spec.params.rects ?? [];
  const count = spec.questionCount ?? 12;
  const young = isYoungGrade(grade);
  const s0 = at(shapes, 0);

  const blocks = buildStandardBlocks({
    spec,
    animationId: 'shapes-intro',
    animationSteps: [
      { atMs: 0, caption: `Perhatikan ${s0.name}.`, frame: 'shape' },
      { atMs: 600, caption: `Hitung sisinya: ${idNum(s0.sides)} sisi.`, frame: 'sides' },
      { atMs: 1200, caption: `Hitung titik sudutnya: ${idNum(s0.vertices)} titik sudut.`, frame: 'vertices' },
    ],
    animationTranscript: `Animasi menyorot ${idNum(s0.sides)} sisi dan ${idNum(s0.vertices)} titik sudut pada ${s0.name}.`,
    illustrationCaption: `Kumpulan bangun datar: ${shapes.map((s) => s.name).join(', ')}.`,
    illustrationAlt: `Gambar ${shapes.length} bangun datar berbeda diberi nama: ${shapes.map((s) => s.name).join(', ')}.`,
    illustrationPrimitive: { name: 'ShapeFigure', props: { title: s0.name, shape: toNamedShape(s0.name) } },
    widgetType: 'IMAGE_HOTSPOT',
    widgetParams: {
      mediaAssetId: assetKey(grade, `${spec.id}-hotspots`),
      hotspots: shapes.slice(0, 6).map((s, i) => ({
        id: `h${i}`,
        xPercent: 12 + (i % 3) * 30,
        yPercent: 25 + Math.floor(i / 3) * 40,
        label: s.name,
        body: `${s.name}: ${idNum(s.sides)} sisi, ${idNum(s.vertices)} titik sudut.`,
      })),
    },
    videoTranscript: `Video mengenalkan ciri bangun datar: jumlah sisi, titik sudut, dan contohnya di sekitar kita.`,
  });

  const questions: LessonQuestionInput[] = [];

  // O4 — placement: number of sides/edges of a shape on a small line.
  const nlMax = Math.max(10, ...shapes.map((s) => s.sides + 2));
  questions.push(
    numberLineQuestion({
      id: `${spec.id}-q1`,
      grade,
      promptText: `Ada berapa sisi pada ${s0.name}? Letakkan jawabanmu pada garis.`,
      min: 0,
      max: nlMax,
      step: 1,
      targetValue: s0.sides,
      explanation: `${s0.name} memiliki ${idNum(s0.sides)} sisi.`,
      hints: [`Telusuri tepi bangun sambil menghitung.`],
      narrationText: young ? `Geser penanda ke jumlah sisi ${s0.name}.` : undefined,
    }),
  );

  // O4 — grouping shapes by side count (<=3 vs >3), or "punya 4 sisi" vs "tidak".
  const four = shapes.slice(0, 4);
  const mapping: Record<string, string> = {};
  four.forEach((s, i) => {
    mapping[`i${i}`] = s.sides === 4 ? 'four' : 'other';
  });
  if (new Set(Object.values(mapping)).size === 1) mapping.i0 = mapping.i0 === 'four' ? 'other' : 'four';
  questions.push(
    dragGroupQuestion({
      id: `${spec.id}-q2`,
      grade,
      promptText: `Kelompokkan bangun: bersisi 4 atau tidak.`,
      items: four.map((s, i) => ({
        id: `i${i}`,
        label: s.name,
        ...(young ? { illustrationAssetId: `assets/lessons/sd/kelas-${grade}/gm/${spec.id}-i${i}.svg` } : {}),
      })),
      groups: [
        { id: 'four', label: 'Bersisi 4' },
        { id: 'other', label: 'Bukan bersisi 4' },
      ],
      correctMapping: mapping,
      explanation: `Hitung sisi tiap bangun.`,
      hints: [`Segiempat punya tepat 4 sisi.`],
      narrationText: young ? `Pisahkan bangun bersisi empat.` : undefined,
    }),
  );

  for (let i = 0; i < count - 2; i += 1) {
    const s = at(shapes, i % shapes.length);
    const qid = `${spec.id}-q${i + 3}`;
    const canRect = !young && rects.length > 0 && i % 3 === 2;

    if (canRect) {
      const [w, h] = at(rects, i % rects.length);
      const usePerimeter = i % 2 === 0;
      const value = usePerimeter ? 2 * (w + h) : w * h;
      questions.push(
        shortAnswerQuestion({
          id: qid,
          grade,
          promptText: usePerimeter
            ? `Sebuah persegi panjang berukuran ${idNum(w)} x ${idNum(h)}. Berapa kelilingnya?`
            : `Sebuah persegi panjang berukuran ${idNum(w)} x ${idNum(h)}. Berapa luasnya?`,
          acceptedAnswers: [String(value), idNum(value)],
          explanation: usePerimeter
            ? `Keliling = 2 x (${idNum(w)} + ${idNum(h)}) = ${idNum(value)}.`
            : `Luas = ${idNum(w)} x ${idNum(h)} = ${idNum(value)}.`,
          hints: [usePerimeter ? `Jumlahkan semua sisi.` : `Kalikan panjang dengan lebar.`],
        }),
      );
    } else if (i % 2 === 0) {
      const opts = distinctNumericOptions(s.sides, [s.sides + 1, s.sides - 1, s.vertices, s.sides + 2]).map(
        (text, j) => ({ id: OPTLET(j), text }),
      );
      questions.push(
        mcQuestion({
          id: qid,
          grade,
          promptText: `Ada berapa sisi pada ${s.name}?`,
          options: young
            ? opts.map((o) => ({ ...o, illustrationAssetId: `assets/lessons/sd/kelas-${grade}/gm/${qid}-${o.id}.svg` }))
            : opts,
          correctOptionId: 'a',
          explanation: `${s.name} memiliki ${idNum(s.sides)} sisi dan ${idNum(s.vertices)} titik sudut.`,
          hints: [`Telusuri tepi bangun sambil menghitung.`],
          narrationText: young ? `Berapa sisi ${s.name}?` : undefined,
        }),
      );
    } else {
      const wrong1 = at(shapes, (i + 1) % shapes.length);
      const wrong2 = at(shapes, (i + 2) % shapes.length);
      const opts = [
        { id: 'a', text: s.name },
        { id: 'b', text: wrong1.name === s.name ? `${wrong1.name} besar` : wrong1.name },
        { id: 'c', text: wrong2.name === s.name ? `${wrong2.name} kecil` : wrong2.name },
      ];
      questions.push(
        mcQuestion({
          id: qid,
          grade,
          promptText: `Bangun datar dengan ${idNum(s.sides)} sisi dan ${idNum(s.vertices)} titik sudut adalah...`,
          options: young
            ? opts.map((o) => ({ ...o, illustrationAssetId: `assets/lessons/sd/kelas-${grade}/gm/${qid}-${o.id}.svg` }))
            : opts,
          correctOptionId: 'a',
          explanation: `${s.name} berciri ${idNum(s.sides)} sisi dan ${idNum(s.vertices)} titik sudut.`,
          hints: [`Cocokkan jumlah sisi dengan nama bangun.`],
          narrationText: young ? `Bangun apa yang bersisi ${idNum(s.sides)}?` : undefined,
        }),
      );
    }
  }

  return assembleLesson(spec, 'GEOMETRY', blocks, questions);
}
