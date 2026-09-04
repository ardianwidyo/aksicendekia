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
  passOf,
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
  const count = spec.questionCount ?? DEFAULT_QUESTION_COUNT;
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
    illustrationPrimitive: { name: 'BarChartMini', props: { title: 'Diagram batang', data: cats.map((c) => ({ label: c.name, value: c.count })) } },
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

  // A 4-category dataset only affords so many distinct readings; rotate through
  // a spread of question forms (count / difference / sum / comparison, plus the
  // occasional whole-chart question) so 30 items stay varied.
  const youngForms = ['count', 'diff', 'sum', 'which', 'count', 'diff', 'sum', 'which', 'most', 'least'] as const;
  const olderForms = [
    'count', 'diff', 'sum', 'which', 'total',
    'count', 'diff', 'sum', 'which', 'categories',
    'count', 'diff', 'most', 'least',
  ] as const;
  const forms = young ? youngForms : olderForms;
  const dcAsset = (q: string, id: string): string => `assets/lessons/sd/kelas-${grade}/dc/${q}-${id}.svg`;

  for (let i = 0; i < count - 2; i += 1) {
    const p = passOf(i, forms.length);
    // stride 3 is coprime with 4 categories, so the primary walks all of them.
    const cIdx = (i * 3) % cats.length;
    let oIdx = (i * 3 + 1 + p) % cats.length;
    if (oIdx === cIdx) oIdx = (oIdx + 1) % cats.length;
    const c = at(cats, cIdx);
    const other = at(cats, oIdx);
    const qid = `${spec.id}-q${i + 3}`;
    const form = at(forms, i % forms.length);

    if (form === 'count') {
      const opts = distinctNumericOptions(c.count, [c.count + 1, c.count - 1, c.count + 2, other.count]).map(
        (text, j) => ({ id: OPTLET(j), text }),
      );
      questions.push(
        mcQuestion({
          id: qid,
          grade,
          promptText: `Pada diagram, berapa banyak ${c.name}?`,
          options: young ? opts.map((o) => ({ ...o, illustrationAssetId: dcAsset(qid, o.id) })) : opts,
          correctOptionId: 'a',
          explanation: `Batang ${c.name} menunjukkan ${idNum(c.count)}.`,
          hints: [`Baca tinggi batang ${c.name} pada sumbu tegak.`],
          narrationText: young ? `Berapa banyak ${c.name}?` : undefined,
        }),
      );
    } else if (form === 'diff') {
      const diff = Math.abs(c.count - other.count);
      const opts = distinctNumericOptions(diff, [c.count + other.count, diff + 1, diff - 1, c.count]).map(
        (text, j) => ({ id: OPTLET(j), text }),
      );
      questions.push(
        mcQuestion({
          id: qid,
          grade,
          promptText: `Berapa selisih banyak ${c.name} (${idNum(c.count)}) dan ${other.name} (${idNum(other.count)})?`,
          options: young ? opts.map((o) => ({ ...o, illustrationAssetId: dcAsset(qid, o.id) })) : opts,
          correctOptionId: 'a',
          explanation: `|${idNum(c.count)} - ${idNum(other.count)}| = ${idNum(diff)}.`,
          hints: [`Kurangkan yang kecil dari yang besar.`],
          narrationText: young ? `Berapa selisihnya?` : undefined,
        }),
      );
    } else if (form === 'sum') {
      const sum = c.count + other.count;
      const opts = distinctNumericOptions(sum, [Math.abs(c.count - other.count), sum + 1, sum - 2, c.count]).map(
        (text, j) => ({ id: OPTLET(j), text }),
      );
      questions.push(
        mcQuestion({
          id: qid,
          grade,
          promptText: `Berapa jumlah banyak ${c.name} (${idNum(c.count)}) dan ${other.name} (${idNum(other.count)})?`,
          options: young ? opts.map((o) => ({ ...o, illustrationAssetId: dcAsset(qid, o.id) })) : opts,
          correctOptionId: 'a',
          explanation: `${idNum(c.count)} + ${idNum(other.count)} = ${idNum(sum)}.`,
          hints: [`Jumlahkan tinggi kedua batang.`],
          narrationText: young ? `Berapa jumlah keduanya?` : undefined,
        }),
      );
    } else if (form === 'which') {
      const hi = c.count >= other.count ? c : other;
      const lo = hi === c ? other : c;
      const opts = [
        { id: 'a', text: hi.name },
        { id: 'b', text: lo.name },
        { id: 'c', text: 'Sama banyak' },
      ];
      questions.push(
        mcQuestion({
          id: qid,
          grade,
          promptText: `Mana yang lebih banyak, ${c.name} atau ${other.name}?`,
          options: young ? opts.map((o) => ({ ...o, illustrationAssetId: dcAsset(qid, o.id) })) : opts,
          correctOptionId: c.count === other.count ? 'c' : 'a',
          explanation:
            c.count === other.count
              ? `${c.name} dan ${other.name} sama banyak (${idNum(c.count)}).`
              : `${hi.name} (${idNum(hi.count)}) lebih banyak dari ${lo.name} (${idNum(lo.count)}).`,
          hints: [`Bandingkan tinggi kedua batang.`],
          narrationText: young ? `Kategori mana yang lebih banyak?` : undefined,
        }),
      );
    } else if (form === 'most' || form === 'least') {
      const target = form === 'most' ? most : least;
      const opts = [
        { id: 'a', text: target.name },
        { id: 'b', text: (form === 'most' ? least : most).name },
        { id: 'c', text: at(cats, (cIdx + 1) % cats.length).name },
      ];
      const seen = new Set<string>();
      const uniqueOpts = opts.filter((o) => (seen.has(o.text) ? false : (seen.add(o.text), true)));
      while (uniqueOpts.length < 2) {
        uniqueOpts.push({ id: OPTLET(uniqueOpts.length), text: `Bukan ${target.name} (${uniqueOpts.length})` });
      }
      questions.push(
        mcQuestion({
          id: qid,
          grade,
          promptText: `Kategori dengan jumlah ${form === 'most' ? 'terbanyak' : 'paling sedikit'} adalah...`,
          options: young ? uniqueOpts.map((o) => ({ ...o, illustrationAssetId: dcAsset(qid, o.id) })) : uniqueOpts,
          correctOptionId: 'a',
          explanation: `${target.name} memiliki ${idNum(target.count)}, ${form === 'most' ? 'paling banyak' : 'paling sedikit'} di antara semua kategori.`,
          hints: [`Cari batang ${form === 'most' ? 'tertinggi' : 'terpendek'}.`],
          narrationText: young ? `Kategori mana yang ${form === 'most' ? 'paling banyak' : 'paling sedikit'}?` : undefined,
        }),
      );
    } else if (form === 'categories') {
      questions.push(
        shortAnswerQuestion({
          id: qid,
          grade,
          promptText: `Ada berapa kategori yang ditampilkan pada diagram?`,
          acceptedAnswers: [String(cats.length), idNum(cats.length)],
          explanation: `Diagram memuat ${idNum(cats.length)} kategori: ${cats.map((x) => x.name).join(', ')}.`,
          hints: [`Hitung banyak batang / baris pada diagram.`],
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
