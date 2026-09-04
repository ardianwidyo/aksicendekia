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
  const count = spec.questionCount ?? DEFAULT_QUESTION_COUNT;
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
    illustrationPrimitive: { name: 'MoneyStack', props: { title: 'Nilai uang', denominations: prices.slice(0, 4).map((p) => ({ value: p.price, count: 1 })) } },
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

  const mnAsset = (q: string, id: string): string => `assets/lessons/sd/kelas-${grade}/mn/${q}-${id}.svg`;
  const priciest = prices.reduce((a, b) => (b.price > a.price ? b : a));
  const cheapest = prices.reduce((a, b) => (b.price < a.price ? b : a));
  const youngForms = ['change', 'sum', 'enough', 'change', 'sum', 'priciest'] as const;
  const olderForms = [
    'change', 'sum', 'changeSA', 'twoItems', 'priciest',
    'change', 'sum', 'cheapest', 'twoItems', 'changeSA',
  ] as const;
  const forms = young ? youngForms : olderForms;

  for (let i = 0; i < count - 2; i += 1) {
    const pass = passOf(i, forms.length);
    const item = at(prices, i % prices.length);
    let oi = (i + 1 + pass) % prices.length;
    if (oi === i % prices.length) oi = (oi + 1) % prices.length;
    const other = at(prices, oi);
    const qid = `${spec.id}-q${i + 3}`;
    const change = paidWith - item.price;
    let form: string = at(forms, i % forms.length);
    if (form === 'change' && change < 0) form = 'sum';
    if (form === 'changeSA' && change < 0) form = 'sum';
    if (form === 'twoItems' && paidWith - item.price - other.price < 0) form = 'sum';

    if (form === 'change') {
      const opts = distinctNumericOptions(change, [item.price, paidWith, change + 1000, change - 500]).map(
        (text, j) => ({ id: OPTLET(j), text: `Rp${text}` }),
      );
      questions.push(
        mcQuestion({
          id: qid,
          grade,
          promptText: `Harga ${item.item} ${rp(item.price)}. Dibayar ${rp(paidWith)}. Berapa kembaliannya?`,
          options: young ? opts.map((o) => ({ ...o, illustrationAssetId: mnAsset(qid, o.id) })) : opts,
          correctOptionId: 'a',
          explanation: `${rp(paidWith)} - ${rp(item.price)} = ${rp(change)}.`,
          hints: [`Kembalian = uang dibayar - harga.`],
          narrationText: young ? `Berapa kembaliannya?` : undefined,
        }),
      );
    } else if (form === 'sum') {
      const total = item.price + other.price;
      const opts = distinctNumericOptions(total, [Math.abs(item.price - other.price), total + 500, total - 1000, item.price]).map(
        (text, j) => ({ id: OPTLET(j), text: `Rp${text}` }),
      );
      questions.push(
        mcQuestion({
          id: qid,
          grade,
          promptText: `Berapa harga ${item.item} (${rp(item.price)}) dan ${other.item} (${rp(other.price)}) jika dibeli bersama?`,
          options: young ? opts.map((o) => ({ ...o, illustrationAssetId: mnAsset(qid, o.id) })) : opts,
          correctOptionId: 'a',
          explanation: `${rp(item.price)} + ${rp(other.price)} = ${rp(total)}.`,
          hints: [`Jumlahkan kedua harga.`],
          narrationText: young ? `Berapa totalnya?` : undefined,
        }),
      );
    } else if (form === 'twoItems') {
      const rem = paidWith - item.price - other.price;
      const opts = distinctNumericOptions(rem, [item.price + other.price, rem + 1000, rem - 500, paidWith]).map(
        (text, j) => ({ id: OPTLET(j), text: `Rp${text}` }),
      );
      questions.push(
        mcQuestion({
          id: qid,
          grade,
          promptText: `Beli ${item.item} (${rp(item.price)}) dan ${other.item} (${rp(other.price)}), dibayar ${rp(paidWith)}. Berapa kembaliannya?`,
          options: young ? opts.map((o) => ({ ...o, illustrationAssetId: mnAsset(qid, o.id) })) : opts,
          correctOptionId: 'a',
          explanation: `${rp(paidWith)} - ${rp(item.price)} - ${rp(other.price)} = ${rp(rem)}.`,
          hints: [`Jumlahkan dulu kedua harga, lalu kurangkan dari uang dibayar.`],
          narrationText: young ? `Berapa kembaliannya?` : undefined,
        }),
      );
    } else if (form === 'priciest' || form === 'cheapest') {
      const target = form === 'priciest' ? priciest : cheapest;
      const opposite = form === 'priciest' ? cheapest : priciest;
      const opts = [
        { id: 'a', text: target.item },
        { id: 'b', text: opposite.item },
        { id: 'c', text: at(prices, (i % prices.length + 1) % prices.length).item },
      ];
      const seen = new Set<string>();
      const uniq = opts.filter((o) => (seen.has(o.text) ? false : (seen.add(o.text), true)));
      while (uniq.length < 2) uniq.push({ id: OPTLET(uniq.length), text: `bukan ${target.item} (${uniq.length})` });
      questions.push(
        mcQuestion({
          id: qid,
          grade,
          promptText: `Barang manakah yang ${form === 'priciest' ? 'paling mahal' : 'paling murah'}?`,
          options: young ? uniq.map((o) => ({ ...o, illustrationAssetId: mnAsset(qid, o.id) })) : uniq,
          correctOptionId: 'a',
          explanation: `${target.item} ${rp(target.price)} adalah yang ${form === 'priciest' ? 'termahal' : 'termurah'}.`,
          hints: [`Bandingkan semua harga.`],
          narrationText: young ? `Pilih barang yang ${form === 'priciest' ? 'paling mahal' : 'paling murah'}.` : undefined,
        }),
      );
    } else if (form === 'enough') {
      const pairTotal = item.price + other.price;
      const canBuy = pairTotal <= paidWith;
      const opts = [
        { id: 'a', text: 'Cukup' },
        { id: 'b', text: 'Tidak cukup' },
      ];
      questions.push(
        mcQuestion({
          id: qid,
          grade,
          promptText: `Kamu punya ${rp(paidWith)}. Cukup untuk membeli ${item.item} (${rp(item.price)}) dan ${other.item} (${rp(other.price)}) sekaligus?`,
          options: young ? opts.map((o) => ({ ...o, illustrationAssetId: mnAsset(qid, o.id) })) : opts,
          correctOptionId: canBuy ? 'a' : 'b',
          explanation: canBuy
            ? `${rp(item.price)} + ${rp(other.price)} = ${rp(pairTotal)} <= ${rp(paidWith)}, jadi cukup.`
            : `${rp(item.price)} + ${rp(other.price)} = ${rp(pairTotal)} > ${rp(paidWith)}, jadi tidak cukup.`,
          hints: [`Jumlahkan dulu kedua harga, lalu bandingkan dengan uangmu.`],
          narrationText: young ? `Cukup atau tidak?` : undefined,
        }),
      );
    } else {
      questions.push(
        shortAnswerQuestion({
          id: qid,
          grade,
          promptText: `Harga ${item.item} ${rp(item.price)}, dibayar ${rp(paidWith)}. Tulis kembalian dalam angka (tanpa "Rp").`,
          acceptedAnswers: [String(Math.max(0, change)), idNum(Math.max(0, change))],
          explanation: `${idNum(paidWith)} - ${idNum(item.price)} = ${idNum(change)}.`,
          hints: [`Kurangkan harga dari uang yang dibayarkan.`],
        }),
      );
    }
  }

  return assembleLesson(spec, 'MONEY', blocks, questions);
}
