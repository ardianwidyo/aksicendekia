import type { InteractiveLesson, LessonQuestionInput } from '../types.js';
import {
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
 * `measurement` archetype — length, weight, volume and unit relationships.
 * Widget: PARAMETER_EXPLORER. Kelas 1-5.
 */
export interface MeasurementLessonSpec extends ArchetypeSpecBase {
  params: {
    quantity: 'panjang' | 'berat' | 'volume' | 'waktu';
    /** e.g. { base: 'm', sub: 'cm', factor: 100 } */
    base: string;
    sub: string;
    factor: number;
    /** Named objects with a measure expressed in the sub unit. */
    objects: Array<{ name: string; sub: number }>;
  };
}

export function makeMeasurementLesson(spec: MeasurementLessonSpec): InteractiveLesson {
  const { gradeLevel: grade } = spec;
  const { quantity, base, sub, factor, objects } = spec.params;
  if (objects.length < 4) throw new Error(`${spec.id}: measurement butuh >= 4 objek.`);
  if (factor < 2) throw new Error(`${spec.id}: factor konversi harus >= 2.`);
  const count = spec.questionCount ?? 12;
  const young = isYoungGrade(grade);
  const o0 = at(objects, 0);
  const maxSub = Math.max(...objects.map((o) => o.sub));
  const nlMax = Math.ceil((maxSub + 1) / factor) * factor;

  const blocks = buildStandardBlocks({
    spec,
    animationId: 'compare-quantity',
    animationSteps: [
      { atMs: 0, caption: `Ukur ${o0.name}: ${idNum(o0.sub)} ${sub}.`, frame: 'measure' },
      { atMs: 700, caption: `${idNum(factor)} ${sub} = 1 ${base}.`, frame: 'relate' },
      { atMs: 1400, caption: `${idNum(o0.sub)} ${sub} = ${idNum(o0.sub / factor)} ${base}.`, frame: 'convert' },
    ],
    animationTranscript: `Animasi mengukur ${o0.name} sepanjang ${idNum(o0.sub)} ${sub} lalu mengubahnya ke ${base} dengan ${idNum(factor)} ${sub} = 1 ${base}.`,
    illustrationCaption: `Penggaris menunjukkan ${quantity} beberapa benda dalam satuan ${sub}.`,
    illustrationAlt: `Gambar penggaris/timbangan dengan benda yang ${quantity}nya ditandai dalam ${sub}.`,
    illustrationPrimitive: { name: 'NumberLineStrip', props: { title: `${o0.name}: ${idNum(o0.sub)} ${sub}`, min: 0, max: nlMax, step: nlMax / 10, highlightValues: [o0.sub] } },
    widgetType: 'PARAMETER_EXPLORER',
    widgetParams: {
      expressionId: 'proportional-y-kx',
      variables: [
        { key: 'x', label: `Nilai (${sub})`, min: 0, max: nlMax, step: Math.max(1, Math.round(factor / 10)), initial: o0.sub },
        { key: 'k', label: `1 / faktor`, min: 1 / factor, max: 1 / factor, step: 1 / factor, initial: 1 / factor },
      ],
    },
    videoTranscript: `Video menjelaskan hubungan antar satuan ${quantity} dan cara mengonversinya.`,
  });

  const questions: LessonQuestionInput[] = [];

  // O4 — placement of an object's measure on a sub-unit line.
  questions.push(
    numberLineQuestion({
      id: `${spec.id}-q1`,
      grade,
      promptText: `Letakkan ${quantity} ${o0.name} (${idNum(o0.sub)} ${sub}) pada garis.`,
      min: 0,
      max: nlMax,
      step: nlMax / 10,
      targetValue: o0.sub,
      tolerance: 0,
      explanation: `${o0.name} berukuran ${idNum(o0.sub)} ${sub}.`,
      hints: [`Garis dibagi tiap ${idNum(nlMax / 10)} ${sub}.`],
      narrationText: young ? `Geser penanda ke ${idNum(o0.sub)} ${sub}.` : undefined,
    }),
  );

  // O4 — grouping: shorter vs longer than a midpoint (in sub units).
  const mid = Math.round(nlMax / 2);
  const four = objects.slice(0, 4);
  const mapping: Record<string, string> = {};
  four.forEach((o, i) => {
    mapping[`i${i}`] = o.sub < mid ? 'lo' : 'hi';
  });
  if (new Set(Object.values(mapping)).size === 1) mapping.i0 = mapping.i0 === 'lo' ? 'hi' : 'lo';
  questions.push(
    dragGroupQuestion({
      id: `${spec.id}-q2`,
      grade,
      promptText: `Kelompokkan benda: ${quantity} kurang dari ${idNum(mid)} ${sub} atau ${idNum(mid)} ${sub} ke atas.`,
      items: four.map((o, i) => ({
        id: `i${i}`,
        label: `${o.name} (${idNum(o.sub)} ${sub})`,
        ...(young ? { illustrationAssetId: `assets/lessons/sd/kelas-${grade}/ms/${spec.id}-i${i}.svg` } : {}),
      })),
      groups: [
        { id: 'lo', label: `< ${idNum(mid)} ${sub}` },
        { id: 'hi', label: `>= ${idNum(mid)} ${sub}` },
      ],
      correctMapping: mapping,
      explanation: `Bandingkan tiap ukuran dengan ${idNum(mid)} ${sub}.`,
      hints: [`Samakan satuannya lebih dulu bila perlu.`],
      narrationText: young ? `Pisahkan benda yang lebih pendek dan lebih panjang.` : undefined,
    }),
  );

  for (let i = 0; i < count - 2; i += 1) {
    const o = at(objects, i % objects.length);
    const qid = `${spec.id}-q${i + 3}`;
    const shape = young ? i % 2 : i % 3;

    if (shape === 0) {
      const inBase = o.sub / factor;
      const opts = distinctNumericOptions(inBase, [o.sub, inBase * factor, inBase + 1, inBase / 2]).map(
        (text, j) => ({ id: OPTLET(j), text }),
      );
      questions.push(
        mcQuestion({
          id: qid,
          grade,
          promptText: `${idNum(o.sub)} ${sub} sama dengan berapa ${base}?`,
          options: young
            ? opts.map((op) => ({ ...op, illustrationAssetId: `assets/lessons/sd/kelas-${grade}/ms/${qid}-${op.id}.svg` }))
            : opts,
          correctOptionId: 'a',
          explanation: `${idNum(factor)} ${sub} = 1 ${base}, jadi ${idNum(o.sub)} : ${idNum(factor)} = ${idNum(inBase)} ${base}.`,
          hints: [`Bagi dengan ${idNum(factor)} untuk berpindah dari ${sub} ke ${base}.`],
          narrationText: young ? `${idNum(o.sub)} ${sub} berapa ${base}?` : undefined,
        }),
      );
    } else if (shape === 1) {
      const b = at(objects, (i + 1) % objects.length);
      const bigger = o.sub >= b.sub ? o.name : b.name;
      const opts = [
        { id: 'a', text: bigger },
        { id: 'b', text: bigger === o.name ? b.name : o.name },
        { id: 'c', text: 'Sama panjang' },
      ];
      questions.push(
        mcQuestion({
          id: qid,
          grade,
          promptText: `Mana yang lebih ${quantity === 'berat' ? 'berat' : 'panjang'}: ${o.name} (${idNum(o.sub)} ${sub}) atau ${b.name} (${idNum(b.sub)} ${sub})?`,
          options: young
            ? opts.map((op) => ({ ...op, illustrationAssetId: `assets/lessons/sd/kelas-${grade}/ms/${qid}-${op.id}.svg` }))
            : opts,
          correctOptionId: o.sub === b.sub ? 'c' : 'a',
          explanation:
            o.sub === b.sub
              ? `Keduanya ${idNum(o.sub)} ${sub}.`
              : `${idNum(Math.max(o.sub, b.sub))} ${sub} > ${idNum(Math.min(o.sub, b.sub))} ${sub}.`,
          hints: [`Bandingkan angkanya karena satuannya sama.`],
          narrationText: young ? `Pilih yang lebih panjang.` : undefined,
        }),
      );
    } else {
      questions.push(
        shortAnswerQuestion({
          id: qid,
          grade,
          promptText: `${idNum(o.sub)} ${sub} = ... ${base} (boleh desimal).`,
          acceptedAnswers: [
            String(o.sub / factor),
            idNum(o.sub / factor),
            String(o.sub / factor).replace('.', ','),
          ],
          explanation: `${idNum(o.sub)} : ${idNum(factor)} = ${o.sub / factor} ${base}.`,
          hints: [`${idNum(factor)} ${sub} = 1 ${base}.`],
        }),
      );
    }
  }

  return assembleLesson(spec, 'MEASUREMENT', blocks, questions);
}
