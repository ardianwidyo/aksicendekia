import type { InteractiveLesson, LessonQuestionInput, SdGradeLevel } from '../types.js';
import {
  ASSET_ROOT,
  ArchetypeSpecBase,
  assembleLesson,
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
 * `number-line` archetype — addition, subtraction, ordering, and (kelas 5-6)
 * negative numbers as jumps on a number line. Widget: NUMBER_LINE_EXPLORER.
 */
export interface NumberLineLessonSpec extends ArchetypeSpecBase {
  params: {
    min: number;
    max: number;
    step: number;
    /** [start, jump] pairs. jump may be negative (jump left). */
    jumps: Array<[number, number]>;
    allowNegative?: boolean;
  };
}

function optionAsset(grade: SdGradeLevel, slug: string): string {
  return `${ASSET_ROOT}/kelas-${grade}/nl/${slug}.svg`;
}

export function makeNumberLineLesson(spec: NumberLineLessonSpec): InteractiveLesson {
  const { gradeLevel: grade } = spec;
  const { min, max, step, jumps } = spec.params;
  if (max <= min) throw new Error(`${spec.id}: number-line max harus > min.`);
  if (jumps.length < 4) throw new Error(`${spec.id}: number-line butuh >= 4 pasangan lompatan.`);
  const count = spec.questionCount ?? 12;
  const young = isYoungGrade(grade);
  const markers: number[] = [];
  for (let m = min; m <= max && markers.length < 10; m += (max - min) / 5) markers.push(Math.round(m));

  const [s0, j0] = at(jumps, 0);
  const blocks = buildStandardBlocks({
    spec,
    animationId: spec.params.allowNegative ? 'integer-number-line' : 'number-line-walk',
    animationSteps: [
      { atMs: 0, caption: `Mulai di angka ${idNum(s0)}.`, frame: 'start' },
      {
        atMs: 600,
        caption: `Melompat ${idNum(Math.abs(j0))} ke ${j0 < 0 ? 'kiri' : 'kanan'}.`,
        frame: 'jump',
      },
      { atMs: 1200, caption: `Berhenti di ${idNum(s0 + j0)}. Jadi ${idNum(s0)} ${j0 < 0 ? '-' : '+'} ${idNum(Math.abs(j0))} = ${idNum(s0 + j0)}.`, frame: 'land' },
    ],
    animationTranscript: `Animasi melompat dari ${idNum(s0)} sejauh ${idNum(Math.abs(j0))} ${j0 < 0 ? 'ke kiri' : 'ke kanan'} sampai tiba di ${idNum(s0 + j0)}.`,
    illustrationCaption: `Garis bilangan dari ${idNum(min)} sampai ${idNum(max)} dengan sebuah lompatan ditandai.`,
    illustrationAlt: `Garis bilangan bertanda ${idNum(min)} hingga ${idNum(max)}; panah lompatan dari ${idNum(s0)} ke ${idNum(s0 + j0)}.`,
    widgetType: 'NUMBER_LINE_EXPLORER',
    widgetParams: { min, max, step, initial: s0, markers },
    videoTranscript: `Video memperagakan penjumlahan dan pengurangan sebagai lompatan pada garis bilangan.`,
  });

  const questions: LessonQuestionInput[] = [];

  // O4 — placement questions from the jump table (result of each jump).
  for (let k = 0; k < Math.min(3, jumps.length); k += 1) {
    const [start, jump] = at(jumps, k);
    const target = start + jump;
    questions.push(
      numberLineQuestion({
        id: `${spec.id}-q${k + 1}`,
        grade,
        promptText: `Mulai dari ${idNum(start)}, lompat ${idNum(Math.abs(jump))} ke ${jump < 0 ? 'kiri' : 'kanan'}. Di angka berapa kamu berhenti?`,
        min,
        max,
        step,
        targetValue: target,
        explanation: `${idNum(start)} ${jump < 0 ? '-' : '+'} ${idNum(Math.abs(jump))} = ${idNum(target)}.`,
        hints: [
          jump < 0 ? `Melompat ke kiri berarti mengurang.` : `Melompat ke kanan berarti menambah.`,
          `Hitung ${idNum(Math.abs(jump))} langkah dari ${idNum(start)}.`,
        ],
        narrationText: young ? `Geser penanda ke hasil lompatan.` : undefined,
      }),
    );
  }

  // one grouping question: results < midpoint vs >= midpoint
  const mid = Math.round((min + max) / 2);
  const four = jumps.slice(0, 4);
  const mapping: Record<string, string> = {};
  four.forEach(([st, ju], i) => {
    mapping[`i${i}`] = st + ju < mid ? 'lo' : 'hi';
  });
  if (new Set(Object.values(mapping)).size === 1) mapping.i0 = mapping.i0 === 'lo' ? 'hi' : 'lo';
  questions.push(
    dragGroupQuestion({
      id: `${spec.id}-q4`,
      grade,
      promptText: `Kelompokkan hasil operasi: kurang dari ${idNum(mid)} atau ${idNum(mid)} ke atas.`,
      items: four.map(([st, ju], i) => ({
        id: `i${i}`,
        label: `${idNum(st)} ${ju < 0 ? '-' : '+'} ${idNum(Math.abs(ju))}`,
        ...(young ? { illustrationAssetId: optionAsset(grade, `${spec.id}-i${i}`) } : {}),
      })),
      groups: [
        { id: 'lo', label: `Kurang dari ${idNum(mid)}` },
        { id: 'hi', label: `${idNum(mid)} atau lebih` },
      ],
      correctMapping: mapping,
      explanation: `Selesaikan tiap operasi lebih dulu, lalu bandingkan dengan ${idNum(mid)}.`,
      hints: [`Hitung dulu, baru kelompokkan.`],
      narrationText: young ? `Hitung tiap lompatan lalu pisahkan.` : undefined,
    }),
  );

  for (let i = 0; i < count - 4; i += 1) {
    const [start, jump] = at(jumps, i % jumps.length);
    const target = start + jump;
    const qid = `${spec.id}-q${i + 5}`;
    if (!young && i % 2 === 0) {
      questions.push(
        shortAnswerQuestion({
          id: qid,
          grade,
          promptText: `Berapakah ${idNum(start)} ${jump < 0 ? '-' : '+'} ${idNum(Math.abs(jump))}?`,
          acceptedAnswers: [String(target), idNum(target)],
          explanation: `${idNum(start)} ${jump < 0 ? '-' : '+'} ${idNum(Math.abs(jump))} = ${idNum(target)}.`,
          hints: [`Bayangkan lompatan pada garis bilangan.`, `Arah ${jump < 0 ? 'kiri = kurang' : 'kanan = tambah'}.`],
        }),
      );
    } else {
      const opts = distinctNumericOptions(target, [
        start + Math.abs(jump),
        start - jump,
        target + 1,
        target - 2,
      ]).map((text, j) => ({ id: OPTLET(j), text }));
      questions.push(
        mcQuestion({
          id: qid,
          grade,
          promptText: `Lompatan dari ${idNum(start)} ${jump < 0 ? 'ke kiri' : 'ke kanan'} sejauh ${idNum(Math.abs(jump))} berakhir di...`,
          options: young
            ? opts.map((o) => ({ ...o, illustrationAssetId: optionAsset(grade, `${qid}-${o.id}`) }))
            : opts,
          correctOptionId: 'a',
          explanation: `${idNum(start)} ${jump < 0 ? '-' : '+'} ${idNum(Math.abs(jump))} = ${idNum(target)}.`,
          hints: [`Hitung langkah demi langkah dari ${idNum(start)}.`],
          narrationText: young ? `Di angka berapa lompatan berakhir?` : undefined,
        }),
      );
    }
  }

  return assembleLesson(spec, 'NUMBER_LINE', blocks, questions);
}
