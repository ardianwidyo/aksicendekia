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
 * `money` archetype — recognising values and computing change. Widget:
 * SORT_INTO_GROUPS. Kelas 2-4.
 */
export interface MoneyLessonSpec extends ArchetypeSpecBase {
  params: {
    /** Priced items in rupiah (multiples of 100). */
    prices: Array<{ item: string; price: number }>;
    /** Note the shopper pays with (rupiah). */
    paidWith: number;
  };
}

const rp = (n: number): string => `Rp${idNum(n)}`;

export function makeMoneyLesson(spec: MoneyLessonSpec): InteractiveLesson {
  const { gradeLevel: grade } = spec;
  const { prices, paidWith } = spec.params;
  if (prices.length < 4) throw new Error(`${spec.id}: money butuh >= 4 barang.`);
  if (paidWith <= 0) throw new Error(`${spec.id}: paidWith harus > 0.`);
  const count = spec.questionCount ?? 12;
  const young = isYoungGrade(grade);
  const p0 = at(prices, 0);
  const maxPrice = Math.max(...prices.map((p) => p.price));
  const nlMax = Math.max(paidWith, Math.ceil((maxPrice + 1) / 1000) * 1000);

  const blocks = buildStandardBlocks({
    spec,
    animationId: 'count-objects',
    animationSteps: [
      { atMs: 0, caption: `Harga ${p0.item}: ${rp(p0.price)}.`, frame: 'price' },
      { atMs: 700, caption: `Bayar dengan ${rp(paidWith)}.`, frame: 'pay' },
      { atMs: 1400, caption: `Kembalian: ${rp(paidWith - p0.price)}.`, frame: 'change' },
    ],
    animationTranscript: `Animasi membeli ${p0.item} seharga ${rp(p0.price)} dengan uang ${rp(paidWith)} dan menghitung kembalian ${rp(paidWith - p0.price)}.`,
    illustrationCaption: `Uang kertas dan koin bertuliskan berbagai nilai rupiah.`,
    illustrationAlt: `Gambar pecahan uang rupiah: lembaran dan koin dengan nilai berbeda-beda.`,
    widgetType: 'SORT_INTO_GROUPS',
    widgetParams: {
      items: prices.map((p, i) => ({ id: `p${i}`, label: `${p.item} ${rp(p.price)}` })),
      groups: [
        { id: 'yes', label: `Terbeli dengan ${rp(paidWith)}` },
        { id: 'no', label: 'Tidak cukup' },
      ],
      correctMapping: Object.fromEntries(prices.map((p, i) => [`p${i}`, p.price <= paidWith ? 'yes' : 'no'])),
    },
    videoTranscript: `Video mengenalkan nilai pecahan uang rupiah dan cara menghitung kembalian saat berbelanja.`,
  });

  const questions: LessonQuestionInput[] = [];

  // O4 — placement of a price on a rupiah line.
  questions.push(
    numberLineQuestion({
      id: `${spec.id}-q1`,
      grade,
      promptText: `Letakkan harga ${p0.item} (${rp(p0.price)}) pada garis.`,
      min: 0,
      max: nlMax,
      step: nlMax / 10,
      targetValue: p0.price,
      explanation: `${p0.item} berharga ${rp(p0.price)}.`,
      hints: [`Garis dibagi tiap ${rp(nlMax / 10)}.`],
      narrationText: young ? `Geser penanda ke ${rp(p0.price)}.` : undefined,
    }),
  );

  // O4 — grouping affordable vs not.
  const four = prices.slice(0, 4);
  const mapping: Record<string, string> = {};
  four.forEach((p, i) => {
    mapping[`i${i}`] = p.price <= paidWith ? 'yes' : 'no';
  });
  if (new Set(Object.values(mapping)).size === 1) mapping.i0 = mapping.i0 === 'yes' ? 'no' : 'yes';
  questions.push(
    dragGroupQuestion({
      id: `${spec.id}-q2`,
      grade,
      promptText: `Kamu punya ${rp(paidWith)}. Kelompokkan barang: terbeli atau tidak cukup.`,
      items: four.map((p, i) => ({
        id: `i${i}`,
        label: `${p.item} (${rp(p.price)})`,
        ...(young ? { illustrationAssetId: `assets/lessons/sd/kelas-${grade}/mn/${spec.id}-i${i}.svg` } : {}),
      })),
      groups: [
        { id: 'yes', label: 'Terbeli' },
        { id: 'no', label: 'Tidak cukup' },
      ],
      correctMapping: mapping,
      explanation: `Bandingkan tiap harga dengan ${rp(paidWith)}.`,
      hints: [`Barang terbeli bila harganya <= uangmu.`],
      narrationText: young ? `Pisahkan barang yang bisa dibeli.` : undefined,
    }),
  );

  for (let i = 0; i < count - 2; i += 1) {
    const p = at(prices, i % prices.length);
    const qid = `${spec.id}-q${i + 3}`;
    const shape = young ? i % 2 : i % 3;
    const change = paidWith - p.price;

    if (shape === 0 && change >= 0) {
      const opts = distinctNumericOptions(change, [p.price, paidWith, change + 1000, change - 500]).map(
        (text, j) => ({ id: OPTLET(j), text: `Rp${text}` }),
      );
      questions.push(
        mcQuestion({
          id: qid,
          grade,
          promptText: `Harga ${p.item} ${rp(p.price)}. Dibayar ${rp(paidWith)}. Berapa kembaliannya?`,
          options: young
            ? opts.map((o) => ({ ...o, illustrationAssetId: `assets/lessons/sd/kelas-${grade}/mn/${qid}-${o.id}.svg` }))
            : opts,
          correctOptionId: 'a',
          explanation: `${rp(paidWith)} - ${rp(p.price)} = ${rp(change)}.`,
          hints: [`Kembalian = uang dibayar - harga.`],
          narrationText: young ? `Berapa kembaliannya?` : undefined,
        }),
      );
    } else if (shape === 1) {
      const other = at(prices, (i + 1) % prices.length);
      const total = p.price + other.price;
      const opts = distinctNumericOptions(total, [Math.abs(p.price - other.price), total + 500, total - 1000, p.price]).map(
        (text, j) => ({ id: OPTLET(j), text: `Rp${text}` }),
      );
      questions.push(
        mcQuestion({
          id: qid,
          grade,
          promptText: `Berapa harga ${p.item} (${rp(p.price)}) dan ${other.item} (${rp(other.price)}) jika dibeli bersama?`,
          options: young
            ? opts.map((o) => ({ ...o, illustrationAssetId: `assets/lessons/sd/kelas-${grade}/mn/${qid}-${o.id}.svg` }))
            : opts,
          correctOptionId: 'a',
          explanation: `${rp(p.price)} + ${rp(other.price)} = ${rp(total)}.`,
          hints: [`Jumlahkan kedua harga.`],
          narrationText: young ? `Berapa totalnya?` : undefined,
        }),
      );
    } else {
      questions.push(
        shortAnswerQuestion({
          id: qid,
          grade,
          promptText: `Harga ${p.item} ${rp(p.price)}, dibayar ${rp(paidWith)}. Tulis kembalian dalam angka (tanpa "Rp").`,
          acceptedAnswers: [String(Math.max(0, change)), idNum(Math.max(0, change))],
          explanation: `${idNum(paidWith)} - ${idNum(p.price)} = ${idNum(change)}.`,
          hints: [`Kurangkan harga dari uang yang dibayarkan.`],
        }),
      );
    }
  }

  return assembleLesson(spec, 'MONEY', blocks, questions);
}
