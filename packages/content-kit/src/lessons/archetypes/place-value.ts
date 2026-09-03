import type { InteractiveLesson, LessonQuestionInput, SdGradeLevel } from '../types.js';
import {
  ASSET_ROOT,
  ArchetypeSpecBase,
  PLACE_NAMES,
  animationBlock,
  assembleLesson,
  at,
  digitAt,
  distinctNumericOptions,
  dragGroupQuestion,
  embedVideoBlock,
  idNum,
  illustrationBlock,
  isYoungGrade,
  mcQuestion,
  numberLineQuestion,
  pickNonZeroPlace,
  placeValueOf,
  shortAnswerQuestion,
  toOptions,
  widgetBlock,
} from './shared.js';

const OPTLET = (j: number): string => (['a', 'b', 'c', 'd', 'e'][j] ?? 'x');

/**
 * `place-value` archetype (contracts/lesson-authoring.md) — reading, writing and
 * decomposing whole numbers by place. Widget: STEP_REVEAL. Typical kelas 1-4.
 */
export interface PlaceValueLessonSpec extends ArchetypeSpecBase {
  params: {
    /** Seed numbers the questions are generated from (>= 4). */
    numbers: number[];
    /** Places-from-right to prefer when asking (0 = satuan, 1 = puluhan, ...). */
    askPlaces?: number[];
  };
}

function optionAsset(grade: SdGradeLevel, slug: string): string {
  return `${ASSET_ROOT}/kelas-${grade}/pv/${slug}.svg`;
}

function longForm(n: number): string {
  const parts: string[] = [];
  const s = String(n);
  for (let i = 0; i < s.length; i += 1) {
    const place = s.length - 1 - i;
    const d = Number(s[i]);
    if (d !== 0) parts.push(String(d * 10 ** place));
  }
  return parts.join(' + ');
}

export function makePlaceValueLesson(spec: PlaceValueLessonSpec): InteractiveLesson {
  const { gradeLevel: grade } = spec;
  const numbers = spec.params.numbers;
  if (numbers.length < 4) throw new Error(`${spec.id}: place-value butuh >= 4 angka.`);
  const askPlaces = spec.params.askPlaces ?? [2, 1, 3];
  const count = spec.questionCount ?? 12;
  const young = isYoungGrade(grade);

  const anchor = at(numbers, 0);
  const anchorLen = String(anchor).length;
  const blocks = [
    animationBlock({
      grade,
      slug: `${spec.id}-anim`,
      animationId: 'place-value-split',
      steps: [
        { atMs: 0, caption: `Ambil bilangan ${idNum(anchor)}.`, frame: 'number' },
        { atMs: 700, caption: `Uraikan tiap angka menurut tempatnya.`, frame: 'blocks' },
        { atMs: 1400, caption: `${longForm(anchor)} = ${idNum(anchor)}.`, frame: 'sum' },
      ],
      transcriptText: `Animasi menguraikan ${idNum(anchor)} menjadi nilai tempat lalu menjumlahkannya kembali menjadi ${idNum(anchor)}.`,
    }),
    illustrationBlock({
      grade,
      slug: `${spec.id}-blocks`,
      caption: `Blok nilai tempat menyusun ${idNum(at(numbers, 1))}.`,
      altText: `Gambar blok nilai tempat (ribuan, ratusan, puluhan, satuan) yang jumlahnya ${idNum(at(numbers, 1))}.`,
      primitive:
        String(at(numbers, 1)).length <= 4
          ? {
              name: 'PlaceValueBlocks',
              props: {
                title: `Nilai tempat ${idNum(at(numbers, 1))}`,
                thousands: digitAt(at(numbers, 1), 3),
                hundreds: digitAt(at(numbers, 1), 2),
                tens: digitAt(at(numbers, 1), 1),
                ones: digitAt(at(numbers, 1), 0),
              },
            }
          : {
              name: 'NumberLineStrip',
              props: {
                title: `Letak ${idNum(at(numbers, 1))}`,
                min: 0,
                max: 10 ** String(at(numbers, 1)).length,
                step: 10 ** (String(at(numbers, 1)).length - 1),
                highlightValues: [at(numbers, 1)],
              },
            },
    }),
    widgetBlock({
      grade,
      widgetType: 'STEP_REVEAL',
      params: {
        steps: [
          { title: 'Lihat angkanya', body: `Bilangan yang dibahas: ${idNum(anchor)}.` },
          {
            title: 'Tandai tiap tempat',
            body: `Dari kanan: ${PLACE_NAMES.slice(0, anchorLen).join(', ')}.`,
          },
          { title: 'Tulis bentuk panjang', body: `${longForm(anchor)}.` },
          { title: 'Gabungkan kembali', body: `Jumlahnya kembali menjadi ${idNum(anchor)}.` },
        ],
      },
    }),
    embedVideoBlock({
      grade,
      slug: spec.id,
      videoEmbedId: spec.videoEmbedId,
      title: `Video: ${spec.title}`,
      transcriptText: `Video menjelaskan cara membaca dan menguraikan nilai tempat bilangan seperti ${idNum(anchor)}.`,
    }),
  ];

  const questions: LessonQuestionInput[] = [];

  // O4 — one placement question, target = the seed number itself.
  const nlMax = 10 ** anchorLen;
  const nlStep = nlMax / 10;
  questions.push(
    numberLineQuestion({
      id: `${spec.id}-q1`,
      grade,
      promptText: `Letakkan bilangan ${idNum(anchor)} pada garis bilangan.`,
      min: 0,
      max: nlMax,
      step: nlStep,
      targetValue: anchor,
      explanation: `${idNum(anchor)} berada di antara ${idNum(Math.floor(anchor / nlStep) * nlStep)} dan ${idNum((Math.floor(anchor / nlStep) + 1) * nlStep)}.`,
      hints: [
        `Garis dibagi tiap ${idNum(nlStep)}.`,
        `Hitung langkah ${idNum(nlStep)}-an dari 0 sampai mendekati ${idNum(anchor)}.`,
      ],
      narrationText: young ? `Geser penanda ke angka ${idNum(anchor)}.` : undefined,
    }),
  );

  // O4 — one grouping question by a shared place-value digit.
  const groupPlace = pickNonZeroPlace(anchor, at(askPlaces, 0));
  const groupDigit = digitAt(anchor, groupPlace);
  const four = numbers.slice(0, 4);
  const mapping: Record<string, string> = {};
  four.forEach((n, i) => {
    mapping[`i${i}`] = groupPlace < String(n).length && digitAt(n, groupPlace) === groupDigit ? 'hit' : 'miss';
  });
  if (new Set(Object.values(mapping)).size === 1) {
    // force both zones non-empty so the item is genuinely sortable
    mapping.i0 = mapping.i0 === 'hit' ? 'miss' : 'hit';
  }
  questions.push(
    dragGroupQuestion({
      id: `${spec.id}-q2`,
      grade,
      promptText: `Kelompokkan: apakah angka di tempat ${PLACE_NAMES[groupPlace]} bernilai ${groupDigit}?`,
      items: four.map((n, i) => ({
        id: `i${i}`,
        label: idNum(n),
        ...(young ? { illustrationAssetId: optionAsset(grade, `${spec.id}-i${i}`) } : {}),
      })),
      groups: [
        { id: 'hit', label: `${PLACE_NAMES[groupPlace]} = ${groupDigit}` },
        { id: 'miss', label: `Bukan ${groupDigit}` },
      ],
      correctMapping: mapping,
      explanation: `Periksa angka di tempat ${PLACE_NAMES[groupPlace]} untuk tiap bilangan.`,
      hints: [`Hitung posisi angka dari kanan: satuan, puluhan, ratusan, ...`],
      narrationText: young ? `Pisahkan bilangan sesuai angka ${PLACE_NAMES[groupPlace]}nya.` : undefined,
    }),
  );

  for (let i = 0; i < count - 2; i += 1) {
    const n = at(numbers, i % numbers.length);
    const place = pickNonZeroPlace(n, at(askPlaces, i % askPlaces.length));
    const d = digitAt(n, place);
    const value = placeValueOf(n, place);
    const qid = `${spec.id}-q${i + 3}`;
    const shape = young ? i % 2 : i % 3;

    if (shape === 0) {
      const opts = distinctNumericOptions(value, [d, d * 10, value * 10, value + 10 ** place]).map(
        (text, j) => ({ id: OPTLET(j), text }),
      );
      questions.push(
        mcQuestion({
          id: qid,
          grade,
          promptText: `Berapa nilai angka ${d} pada bilangan ${idNum(n)}?`,
          options: young
            ? opts.map((o) => ({ ...o, illustrationAssetId: optionAsset(grade, `${qid}-${o.id}`) }))
            : opts,
          correctOptionId: 'a',
          explanation: `Angka ${d} berada di tempat ${PLACE_NAMES[place]}, jadi nilainya ${value}.`,
          hints: [
            `Hitung posisi angka ${d} dari kanan.`,
            `Urutan tempat: ${PLACE_NAMES.slice(0, String(n).length).join(', ')}.`,
          ],
          narrationText: young ? `Berapa nilai angka ${d} pada ${idNum(n)}?` : undefined,
        }),
      );
    } else if (shape === 1) {
      const opts = distinctNumericOptions(n, [n + 10 ** place, n - 10 ** place, n + 2 * 10 ** place]).map(
        (text, j) => ({ id: OPTLET(j), text }),
      );
      questions.push(
        mcQuestion({
          id: qid,
          grade,
          promptText: `Bilangan manakah yang angka ${PLACE_NAMES[place]}-nya bernilai ${value}?`,
          options: young
            ? opts.map((o) => ({ ...o, illustrationAssetId: optionAsset(grade, `${qid}-${o.id}`) }))
            : opts,
          correctOptionId: 'a',
          explanation: `Pada ${idNum(n)}, angka ${d} di tempat ${PLACE_NAMES[place]} bernilai ${value}.`,
          hints: [`Cek tempat ${PLACE_NAMES[place]} pada tiap pilihan.`],
          narrationText: young ? `Pilih bilangan dengan ${PLACE_NAMES[place]} bernilai ${value}.` : undefined,
        }),
      );
    } else {
      const lf = longForm(n);
      questions.push(
        shortAnswerQuestion({
          id: qid,
          grade,
          promptText: `Tuliskan bentuk panjang dari ${idNum(n)} (contoh: 2000 + 300 + 5).`,
          acceptedAnswers: [lf, lf.replace(/ /g, ''), lf.replace(/ \+ /g, '+')],
          explanation: `${idNum(n)} = ${lf}.`,
          hints: [`Uraikan tiap angka menurut tempatnya.`, `Tempat yang berisi 0 tidak ditulis.`],
        }),
      );
    }
  }

  return assembleLesson(spec, 'PLACE_VALUE', blocks, questions);
}
