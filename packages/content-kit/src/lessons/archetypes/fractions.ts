import type { InteractiveLesson, LessonQuestionInput } from '../types.js';
import {
  ArchetypeSpecBase,
  assembleLesson,
  at,
  buildStandardBlocks,
  dragGroupQuestion,
  isYoungGrade,
  mcQuestion,
  numberLineQuestion,
  shortAnswerQuestion,
  toOptions,
} from './shared.js';

/**
 * `fractions` archetype — fractions as parts of a whole, equivalence,
 * comparison and (kelas 5-6) decimals. Widget: FRACTION_BAR_BUILDER. Kelas 3-6.
 */
export interface FractionsLessonSpec extends ArchetypeSpecBase {
  params: {
    /** Denominators the bar builder + part-of-whole questions use (2..12). */
    denominators: number[];
    /** [n1, d1, n2, d2] comparison pairs. */
    compares: Array<[number, number, number, number]>;
    includeDecimal?: boolean;
  };
}

const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
function simplify(n: number, d: number): [number, number] {
  const g = gcd(n, d) || 1;
  return [n / g, d / g];
}
function cmp(n1: number, d1: number, n2: number, d2: number): number {
  return n1 * d2 - n2 * d1;
}

export function makeFractionsLesson(spec: FractionsLessonSpec): InteractiveLesson {
  const { gradeLevel: grade } = spec;
  if (isYoungGrade(grade)) throw new Error(`${spec.id}: fractions tidak untuk kelas 1-2.`);
  const { denominators, compares } = spec.params;
  if (denominators.length < 3) throw new Error(`${spec.id}: fractions butuh >= 3 penyebut.`);
  if (compares.length < 3) throw new Error(`${spec.id}: fractions butuh >= 3 pasangan perbandingan.`);
  const count = spec.questionCount ?? 12;
  const d0 = at(denominators, 0);

  const blocks = buildStandardBlocks({
    spec,
    animationId: 'fraction-of-whole',
    animationSteps: [
      { atMs: 0, caption: `Sebuah bentuk dibagi ${d0} bagian sama besar.`, frame: 'whole' },
      { atMs: 700, caption: `Satu bagian diarsir: 1/${d0}.`, frame: 'shade-1' },
      { atMs: 1400, caption: `Dua bagian diarsir: 2/${d0}.`, frame: 'shade-2' },
    ],
    animationTranscript: `Animasi membagi satu bentuk menjadi ${d0} bagian sama besar dan mengarsir bagian demi bagian untuk menunjukkan pecahan.`,
    illustrationCaption: `Batang pecahan dibagi ${d0} bagian sama besar; sebagian diarsir.`,
    illustrationAlt: `Batang persegi panjang terbagi ${d0} kolom sama lebar, satu kolom berwarna berbeda menandai 1/${d0}.`,
    widgetType: 'FRACTION_BAR_BUILDER',
    widgetParams: { denominator: d0, targetFraction: { numerator: 1, denominator: d0 }, allowCompare: true },
    videoTranscript: `Video menjelaskan pecahan sebagai bagian yang sama besar dari keseluruhan serta cara membandingkannya.`,
  });

  const questions: LessonQuestionInput[] = [];

  // O4 — placement of a fraction's value on 0..1.
  const nlNum = 1;
  const nlDen = at(denominators, 0);
  questions.push(
    numberLineQuestion({
      id: `${spec.id}-q1`,
      grade,
      promptText: `Letakkan pecahan 1/${nlDen} pada garis dari 0 sampai 1.`,
      min: 0,
      max: 1,
      step: 1 / nlDen,
      targetValue: Number((nlNum / nlDen).toFixed(4)),
      tolerance: 0.02,
      explanation: `1/${nlDen} berada satu langkah 1/${nlDen} dari 0.`,
      hints: [`Bagi garis menjadi ${nlDen} bagian sama panjang.`, `Ambil satu langkah dari 0.`],
    }),
  );

  // O4 — grouping: fractions equal to 1/2 vs not.
  const half = spec.params.compares
    .slice(0, 4)
    .map(([n, d]) => [n, d] as [number, number]);
  while (half.length < 4) half.push([1, half.length + 2]);
  const mapping: Record<string, string> = {};
  half.forEach(([n, d], i) => {
    mapping[`i${i}`] = cmp(n, d, 1, 2) === 0 ? 'half' : 'not';
  });
  if (new Set(Object.values(mapping)).size === 1) {
    half[0] = [1, 2];
    mapping.i0 = 'half';
  }
  questions.push(
    dragGroupQuestion({
      id: `${spec.id}-q2`,
      grade,
      promptText: `Kelompokkan pecahan: senilai dengan 1/2 atau bukan.`,
      items: half.map(([n, d], i) => ({ id: `i${i}`, label: `${n}/${d}` })),
      groups: [
        { id: 'half', label: 'Senilai 1/2' },
        { id: 'not', label: 'Bukan 1/2' },
      ],
      correctMapping: mapping,
      explanation: `Sebuah pecahan senilai 1/2 jika penyebut tepat dua kali pembilang.`,
      hints: [`Cek apakah penyebut = 2 x pembilang.`],
    }),
  );

  for (let i = 0; i < count - 2; i += 1) {
    const qid = `${spec.id}-q${i + 3}`;
    const shape = i % 3;
    if (shape === 0) {
      const [n1, d1, n2, d2] = at(compares, i % compares.length);
      const c = cmp(n1, d1, n2, d2);
      const bigger = c > 0 ? `${n1}/${d1}` : c < 0 ? `${n2}/${d2}` : 'sama besar';
      const opts = [
        { id: 'a', text: `${n1}/${d1}` },
        { id: 'b', text: `${n2}/${d2}` },
        { id: 'c', text: 'Sama besar' },
      ];
      const correct = c > 0 ? 'a' : c < 0 ? 'b' : 'c';
      questions.push(
        mcQuestion({
          id: qid,
          grade,
          promptText: `Mana yang lebih besar, ${n1}/${d1} atau ${n2}/${d2}?`,
          options: opts,
          correctOptionId: correct,
          explanation:
            c === 0
              ? `${n1}/${d1} dan ${n2}/${d2} senilai.`
              : `Bandingkan ${n1}x${d2} = ${n1 * d2} dengan ${n2}x${d1} = ${n2 * d1}. Jadi ${bigger} lebih besar.`,
          hints: [`Samakan penyebut atau kalikan silang.`],
        }),
      );
    } else if (shape === 1) {
      const d = at(denominators, i % denominators.length);
      const part = 2;
      const [sn, sd] = simplify(part, d);
      questions.push(
        shortAnswerQuestion({
          id: qid,
          grade,
          promptText: `Tuliskan pecahan untuk ${part} bagian yang diarsir dari ${d} bagian sama besar (bentuk paling sederhana).`,
          acceptedAnswers: [`${part}/${d}`, `${sn}/${sd}`],
          explanation: `${part} dari ${d} bagian = ${part}/${d}${sn !== part ? ` = ${sn}/${sd}` : ''}.`,
          hints: [`Pembilang = bagian diarsir; penyebut = total bagian.`, `Sederhanakan bila bisa dibagi angka yang sama.`],
        }),
      );
    } else {
      const d = at(denominators, i % denominators.length);
      const [en, ed] = [2, 2 * d];
      const opts = [
        { id: 'a', text: `${en}/${ed}` },
        { id: 'b', text: `${en + 1}/${ed}` },
        { id: 'c', text: `${en}/${ed + 1}` },
      ];
      questions.push(
        mcQuestion({
          id: qid,
          grade,
          promptText: `Pecahan yang senilai dengan 1/${d} adalah...`,
          options: opts,
          correctOptionId: 'a',
          explanation: `Kalikan pembilang dan penyebut 1/${d} dengan 2: ${en}/${ed}.`,
          hints: [`Pecahan senilai diperoleh dengan mengalikan pembilang & penyebut dengan angka sama.`],
        }),
      );
    }
  }

  return assembleLesson(spec, 'FRACTIONS', blocks, questions);
}
