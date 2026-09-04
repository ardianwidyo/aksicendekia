import type { InteractiveLesson, LessonQuestionInput } from '../types.js';
import {
  ArchetypeSpecBase,
  DEFAULT_QUESTION_COUNT,
  assembleLesson,
  at,
  buildStandardBlocks,
  distinctNumericOptions,
  dragGroupQuestion,
  idNum,
  isYoungGrade,
  mcQuestion,
  numberLineQuestion,
  lineParamsFor,
  passOf,
  shortAnswerQuestion,
  toOptions,
} from './shared.js';

const OPTLET = (j: number): string => (['a', 'b', 'c', 'd', 'e'][j] ?? 'x');

/**
 * `operations` archetype — multiplication, division and the properties of
 * operations. Widget: ANIMATED_WORKED_EXAMPLE. Kelas 2-6.
 */
export interface OperationsLessonSpec extends ArchetypeSpecBase {
  params: {
    /** [a, b] fact pairs. Used for a*b and (a*b)/b. */
    factPairs: Array<[number, number]>;
    operation?: 'MUL' | 'DIV' | 'MIX';
  };
}

export function makeOperationsLesson(spec: OperationsLessonSpec): InteractiveLesson {
  const { gradeLevel: grade } = spec;
  const { factPairs } = spec.params;
  if (factPairs.length < 4) throw new Error(`${spec.id}: operations butuh >= 4 pasangan.`);
  const op = spec.params.operation ?? 'MIX';
  const count = spec.questionCount ?? DEFAULT_QUESTION_COUNT;
  const young = isYoungGrade(grade);
  const [a0, b0] = at(factPairs, 0);

  const blocks = buildStandardBlocks({
    spec,
    animationId: 'count-objects',
    animationSteps: [
      { atMs: 0, caption: `${idNum(b0)} kelompok, tiap kelompok ${idNum(a0)} benda.`, frame: 'groups' },
      { atMs: 600, caption: `Hitung semua: ${idNum(a0)} + ${idNum(a0)} + ... sebanyak ${idNum(b0)} kali.`, frame: 'repeat-add' },
      { atMs: 1200, caption: `${idNum(a0)} x ${idNum(b0)} = ${idNum(a0 * b0)}.`, frame: 'product' },
    ],
    animationTranscript: `Animasi menyusun ${idNum(b0)} kelompok berisi ${idNum(a0)} benda dan menghitungnya menjadi ${idNum(a0 * b0)}.`,
    illustrationCaption: `Susunan ${idNum(a0)} baris x ${idNum(b0)} kolom benda.`,
    illustrationAlt: `Larik titik ${idNum(a0)} baris dan ${idNum(b0)} kolom, seluruhnya ${idNum(a0 * b0)} titik.`,
    illustrationPrimitive: (a0 <= 12 && b0 <= 12
      ? { name: 'ArrayGrid', props: { title: `${idNum(a0)} baris x ${idNum(b0)} kolom`, rows: a0, cols: b0 } }
      : { name: 'NumberLineStrip', props: { title: `Hasil ${idNum(a0)} x ${idNum(b0)}`, min: 0, max: Math.ceil((a0 * b0 + 1) / 10) * 10, step: Math.max(1, Math.round((a0 * b0) / 10)), highlightValues: [a0 * b0] } }),
    widgetType: 'ANIMATED_WORKED_EXAMPLE',
    widgetParams: {
      animationId: 'count-objects',
      totalDurationMs: 4000,
      steps: [
        { atMs: 0, caption: `Mulai: ${idNum(a0)} x ${idNum(b0)}.`, frame: 'start' },
        { atMs: 1500, caption: `Sebagai penjumlahan berulang.`, frame: 'expand' },
        { atMs: 3000, caption: `Hasil: ${idNum(a0 * b0)}.`, frame: 'done' },
      ],
    },
    videoTranscript: `Video memperagakan perkalian sebagai penjumlahan berulang dan pembagian sebagai pengelompokan.`,
  });

  const questions: LessonQuestionInput[] = [];

  // O4 — placement: the product on a readable, reachable line.
  const p0 = a0 * b0;
  const nl = lineParamsFor(p0);
  questions.push(
    numberLineQuestion({
      id: `${spec.id}-q1`,
      grade,
      promptText: `Letakkan hasil ${idNum(a0)} x ${idNum(b0)} pada garis bilangan.`,
      min: nl.min,
      max: nl.max,
      step: nl.step,
      markers: nl.markers,
      targetValue: p0,
      explanation: `${idNum(a0)} x ${idNum(b0)} = ${idNum(p0)}.`,
      hints: [`Perkalian sama dengan penjumlahan berulang.`, `${idNum(a0)} ditambahkan sebanyak ${idNum(b0)} kali.`],
      narrationText: young ? `Geser penanda ke hasil ${idNum(a0)} kali ${idNum(b0)}.` : undefined,
    }),
  );

  // O4 — grouping: products even vs odd.
  const four = factPairs.slice(0, 4);
  const mapping: Record<string, string> = {};
  four.forEach(([a, b], i) => {
    mapping[`i${i}`] = (a * b) % 2 === 0 ? 'even' : 'odd';
  });
  if (new Set(Object.values(mapping)).size === 1) mapping.i0 = mapping.i0 === 'even' ? 'odd' : 'even';
  questions.push(
    dragGroupQuestion({
      id: `${spec.id}-q2`,
      grade,
      promptText: `Kelompokkan hasil perkalian: genap atau ganjil.`,
      items: four.map(([a, b], i) => ({
        id: `i${i}`,
        label: `${idNum(a)} x ${idNum(b)}`,
        ...(young ? { illustrationAssetId: `assets/lessons/sd/kelas-${grade}/op/${spec.id}-i${i}.svg` } : {}),
      })),
      groups: [
        { id: 'even', label: 'Genap' },
        { id: 'odd', label: 'Ganjil' },
      ],
      correctMapping: mapping,
      explanation: `Hasil kali genap bila salah satu faktornya genap.`,
      hints: [`Hitung dulu hasilnya, lalu lihat angka satuannya.`],
      narrationText: young ? `Hitung tiap perkalian lalu pisahkan genap dan ganjil.` : undefined,
    }),
  );

  for (let i = 0; i < count - 2; i += 1) {
    // Take the first factor from the seed pair and the second from a
    // pass-rotated partner, so later passes are new facts, not repeats.
    // `a x b` and `(a x b) : b` stay exact for any seed factors.
    const p = passOf(i, factPairs.length);
    const a = at(factPairs, i % factPairs.length)[0];
    const b = at(factPairs, (i + 1 + p) % factPairs.length)[1];
    const product = a * b;
    const qid = `${spec.id}-q${i + 3}`;
    const wantDiv = op === 'DIV' || (op === 'MIX' && (i + p) % 2 === 1);
    // Kelas 1-2 only meet multiplication as grouping — rotate three concrete
    // framings (times / repeated addition / equal sharing) so the small fact
    // list still yields varied questions.
    const youngForm = young ? (i + p) % 3 : -1;

    if (young && youngForm === 1) {
      const opts = distinctNumericOptions(product, [product + a, Math.max(0, product - b), a + b, product + 1]).map(
        (text, j) => ({ id: OPTLET(j), text, illustrationAssetId: `assets/lessons/sd/kelas-${grade}/op/${qid}-${OPTLET(j)}.svg` }),
      );
      questions.push(
        mcQuestion({
          id: qid,
          grade,
          promptText: `${Array.from({ length: b }, () => idNum(a)).join(' + ')} = ...`,
          options: opts,
          correctOptionId: 'a',
          explanation: `${idNum(a)} ditambahkan ${idNum(b)} kali sama dengan ${idNum(a)} x ${idNum(b)} = ${idNum(product)}.`,
          hints: [`Hitung majunya ${idNum(a)}-${idNum(a)}an sebanyak ${idNum(b)} kali.`],
          narrationText: `Berapa hasil menjumlah ${idNum(a)} sebanyak ${idNum(b)} kali?`,
        }),
      );
    } else if (young && youngForm === 2) {
      const opts = distinctNumericOptions(a, [a + 1, Math.max(0, a - 1), b, product]).map(
        (text, j) => ({ id: OPTLET(j), text, illustrationAssetId: `assets/lessons/sd/kelas-${grade}/op/${qid}-${OPTLET(j)}.svg` }),
      );
      questions.push(
        mcQuestion({
          id: qid,
          grade,
          promptText: `${idNum(product)} benda dibagi rata ke ${idNum(b)} wadah. Berapa isi tiap wadah?`,
          options: opts,
          correctOptionId: 'a',
          explanation: `${idNum(product)} dibagi ${idNum(b)} sama besar menghasilkan ${idNum(a)} tiap wadah.`,
          hints: [`Bagikan satu per satu ke tiap wadah sampai habis.`],
          narrationText: `Berapa isi tiap wadah?`,
        }),
      );
    } else if (wantDiv) {
      const opts = distinctNumericOptions(a, [a + 1, a - 1, b, product]).map((text, j) => ({
        id: OPTLET(j),
        text,
      }));
      questions.push(
        mcQuestion({
          id: qid,
          grade,
          promptText: `${idNum(product)} : ${idNum(b)} = ...`,
          options: young
            ? opts.map((o) => ({ ...o, illustrationAssetId: `assets/lessons/sd/kelas-${grade}/op/${qid}-${o.id}.svg` }))
            : opts,
          correctOptionId: 'a',
          explanation: `${idNum(product)} dibagi ${idNum(b)} sama dengan ${idNum(a)} karena ${idNum(a)} x ${idNum(b)} = ${idNum(product)}.`,
          hints: [`Cari bilangan yang bila dikali ${idNum(b)} menghasilkan ${idNum(product)}.`],
          narrationText: young ? `${idNum(product)} dibagi ${idNum(b)} berapa?` : undefined,
        }),
      );
    } else if (!young && (i + p) % 3 === 0) {
      questions.push(
        shortAnswerQuestion({
          id: qid,
          grade,
          promptText: `Berapakah ${idNum(a)} x ${idNum(b)}?`,
          acceptedAnswers: [String(product), idNum(product)],
          explanation: `${idNum(a)} x ${idNum(b)} = ${idNum(product)} (sifat komutatif: sama dengan ${idNum(b)} x ${idNum(a)}).`,
          hints: [`Gunakan penjumlahan berulang bila lupa.`],
        }),
      );
    } else {
      const opts = distinctNumericOptions(product, [product + a, product - b, a + b, product + 1]).map(
        (text, j) => ({ id: OPTLET(j), text }),
      );
      questions.push(
        mcQuestion({
          id: qid,
          grade,
          promptText: `${idNum(a)} x ${idNum(b)} = ...`,
          options: young
            ? opts.map((o) => ({ ...o, illustrationAssetId: `assets/lessons/sd/kelas-${grade}/op/${qid}-${o.id}.svg` }))
            : opts,
          correctOptionId: 'a',
          explanation: `${idNum(a)} x ${idNum(b)} = ${idNum(product)}.`,
          hints: [`${idNum(a)} ditambah dirinya sendiri sebanyak ${idNum(b)} kali.`],
          narrationText: young ? `${idNum(a)} kali ${idNum(b)} berapa?` : undefined,
        }),
      );
    }
  }

  return assembleLesson(spec, 'OPERATIONS', blocks, questions);
}
