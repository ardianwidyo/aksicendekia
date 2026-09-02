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
 * `data-chart` archetype — pictograms, bar charts, mode and simple data
 * interpretation. Widget: SORT_INTO_GROUPS. Kelas 2-6.
 */
export interface DataChartLessonSpec extends ArchetypeSpecBase {
  params: {
    /** Chart categories with their frequency (>= 4 categories, counts differ). */
    categories: Array<{ name: string; count: number }>;
  };
}

export function makeDataChartLesson(spec: DataChartLessonSpec): InteractiveLesson {
  const { gradeLevel: grade } = spec;
  const cats = spec.params.categories;
  if (cats.length < 4) throw new Error(`${spec.id}: data-chart butuh >= 4 kategori.`);
  const count = spec.questionCount ?? 12;
  const young = isYoungGrade(grade);
  const total = cats.reduce((s, c) => s + c.count, 0);
  const most = cats.reduce((a, b) => (b.count > a.count ? b : a));
  const least = cats.reduce((a, b) => (b.count < a.count ? b : a));
  const maxCount = most.count;
  const nlMax = Math.ceil((maxCount + 1) / 5) * 5;

  const blocks = buildStandardBlocks({
    spec,
    animationId: 'compare-quantity',
    animationSteps: [
      { atMs: 0, caption: `Kumpulkan data ${cats.length} kategori.`, frame: 'collect' },
      { atMs: 700, caption: `Gambar satu batang per kategori.`, frame: 'bars' },
      { atMs: 1400, caption: `Batang tertinggi: ${most.name} (${idNum(most.count)}).`, frame: 'read' },
    ],
    animationTranscript: `Animasi menyusun diagram batang dari data ${cats.map((c) => `${c.name} ${c.count}`).join(', ')} lalu membaca kategori terbanyak, yaitu ${most.name}.`,
    illustrationCaption: `Diagram batang: ${cats.map((c) => `${c.name} (${c.count})`).join(', ')}.`,
    illustrationAlt: `Diagram batang dengan ${cats.length} batang; tertinggi ${most.name} bernilai ${idNum(most.count)}, terendah ${least.name} bernilai ${idNum(least.count)}.`,
    widgetType: 'SORT_INTO_GROUPS',
    widgetParams: {
      items: cats.map((c, i) => ({ id: `c${i}`, label: `${c.name}: ${idNum(c.count)}` })),
      groups: [
        { id: 'hi', label: `>= rata-rata` },
        { id: 'lo', label: `< rata-rata` },
      ],
      correctMapping: Object.fromEntries(
        cats.map((c, i) => [`c${i}`, c.count >= total / cats.length ? 'hi' : 'lo']),
      ),
    },
    videoTranscript: `Video menjelaskan cara membaca piktogram dan diagram batang serta menemukan nilai terbanyak (modus).`,
  });

  const questions: LessonQuestionInput[] = [];

  // O4 — placement of a category's frequency.
  questions.push(
    numberLineQuestion({
      id: `${spec.id}-q1`,
      grade,
      promptText: `Pada diagram, berapa banyak ${most.name}? Letakkan pada garis.`,
      min: 0,
      max: nlMax,
      step: nlMax / 10,
      targetValue: most.count,
      explanation: `Batang ${most.name} menunjukkan ${idNum(most.count)}.`,
      hints: [`Baca tinggi batang ${most.name} pada sumbu tegak.`],
      narrationText: young ? `Geser penanda ke jumlah ${most.name}.` : undefined,
    }),
  );

  // O4 — grouping categories above/below the mean.
  const mean = total / cats.length;
  const four = cats.slice(0, 4);
  const mapping: Record<string, string> = {};
  four.forEach((c, i) => {
    mapping[`i${i}`] = c.count >= mean ? 'hi' : 'lo';
  });
  if (new Set(Object.values(mapping)).size === 1) mapping.i0 = mapping.i0 === 'hi' ? 'lo' : 'hi';
  questions.push(
    dragGroupQuestion({
      id: `${spec.id}-q2`,
      grade,
      promptText: `Kelompokkan kategori: di atas atau di bawah rata-rata (${idNum(Math.round(mean))}).`,
      items: four.map((c, i) => ({
        id: `i${i}`,
        label: `${c.name} (${idNum(c.count)})`,
        ...(young ? { illustrationAssetId: `assets/lessons/sd/kelas-${grade}/dc/${spec.id}-i${i}.svg` } : {}),
      })),
      groups: [
        { id: 'hi', label: `>= ${idNum(Math.round(mean))}` },
        { id: 'lo', label: `< ${idNum(Math.round(mean))}` },
      ],
      correctMapping: mapping,
      explanation: `Bandingkan tiap frekuensi dengan rata-rata ${idNum(Math.round(mean))}.`,
      hints: [`Rata-rata = jumlah semua data dibagi banyak kategori.`],
      narrationText: young ? `Pisahkan kategori yang tinggi dan yang rendah.` : undefined,
    }),
  );

  for (let i = 0; i < count - 2; i += 1) {
    const c = at(cats, i % cats.length);
    const other = at(cats, (i + 1) % cats.length);
    const qid = `${spec.id}-q${i + 3}`;
    const shape = young ? i % 2 : i % 3;

    if (shape === 0) {
      const opts = [
        { id: 'a', text: most.name },
        { id: 'b', text: least.name },
        { id: 'c', text: at(cats, Math.floor(cats.length / 2)).name },
      ];
      // ensure distinct labels
      const seen = new Set<string>();
      const uniqueOpts = opts.filter((o) => (seen.has(o.text) ? false : (seen.add(o.text), true)));
      while (uniqueOpts.length < 2) uniqueOpts.push({ id: OPTLET(uniqueOpts.length), text: `${least.name} kembali` });
      questions.push(
        mcQuestion({
          id: qid,
          grade,
          promptText: `Kategori dengan jumlah terbanyak adalah...`,
          options: young
            ? uniqueOpts.map((o) => ({ ...o, illustrationAssetId: `assets/lessons/sd/kelas-${grade}/dc/${qid}-${o.id}.svg` }))
            : uniqueOpts,
          correctOptionId: 'a',
          explanation: `${most.name} memiliki ${idNum(most.count)}, paling banyak di antara semua kategori.`,
          hints: [`Cari batang tertinggi / gambar terbanyak.`],
          narrationText: young ? `Kategori mana yang paling banyak?` : undefined,
        }),
      );
    } else if (shape === 1) {
      const diff = Math.abs(c.count - other.count);
      const opts = distinctNumericOptions(diff, [c.count + other.count, diff + 1, diff - 1, c.count]).map(
        (text, j) => ({ id: OPTLET(j), text }),
      );
      questions.push(
        mcQuestion({
          id: qid,
          grade,
          promptText: `Berapa selisih banyak ${c.name} (${idNum(c.count)}) dan ${other.name} (${idNum(other.count)})?`,
          options: young
            ? opts.map((o) => ({ ...o, illustrationAssetId: `assets/lessons/sd/kelas-${grade}/dc/${qid}-${o.id}.svg` }))
            : opts,
          correctOptionId: 'a',
          explanation: `|${idNum(c.count)} - ${idNum(other.count)}| = ${idNum(diff)}.`,
          hints: [`Kurangkan yang kecil dari yang besar.`],
          narrationText: young ? `Berapa selisihnya?` : undefined,
        }),
      );
    } else {
      questions.push(
        shortAnswerQuestion({
          id: qid,
          grade,
          promptText: `Berapa jumlah seluruh data pada diagram?`,
          acceptedAnswers: [String(total), idNum(total)],
          explanation: `${cats.map((x) => idNum(x.count)).join(' + ')} = ${idNum(total)}.`,
          hints: [`Jumlahkan tinggi semua batang.`],
        }),
      );
    }
  }

  return assembleLesson(spec, 'DATA_CHART', blocks, questions);
}
