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
 * `patterns` archetype — number and picture patterns: continue, find the
 * missing term, describe the rule. Widget: STEP_REVEAL. Kelas 1-5.
 */
export interface PatternsLessonSpec extends ArchetypeSpecBase {
  params: {
    /** Arithmetic sequences: first term + common difference (may be negative). */
    sequences: Array<{ start: number; diff: number }>;
  };
}

function term(start: number, diff: number, n: number): number {
  return start + diff * (n - 1);
}

export function makePatternsLesson(spec: PatternsLessonSpec): InteractiveLesson {
  const { gradeLevel: grade } = spec;
  const seqs = spec.params.sequences;
  if (seqs.length < 4) throw new Error(`${spec.id}: patterns butuh >= 4 barisan.`);
  const count = spec.questionCount ?? 12;
  const young = isYoungGrade(grade);
  const s0 = at(seqs, 0);
  const first5 = [1, 2, 3, 4, 5].map((n) => term(s0.start, s0.diff, n)) as [number, number, number, number, number];

  const blocks = buildStandardBlocks({
    spec,
    animationId: 'sequence-pattern',
    animationSteps: [
      { atMs: 0, caption: `Barisan: ${first5.slice(0, 3).map(idNum).join(', ')}, ...`, frame: 'show' },
      { atMs: 700, caption: `Selisih tiap suku: ${s0.diff > 0 ? '+' : ''}${idNum(s0.diff)}.`, frame: 'rule' },
      { atMs: 1400, caption: `Suku berikutnya: ${idNum(first5[3])}.`, frame: 'next' },
    ],
    animationTranscript: `Animasi menampilkan barisan ${first5.map(idNum).join(', ')} dan menyoroti bahwa tiap suku bertambah ${idNum(s0.diff)}.`,
    illustrationCaption: `Deretan gambar berulang membentuk pola dengan aturan tetap.`,
    illustrationAlt: `Gambar pola: objek berbaris dengan aturan penambahan tetap ${idNum(s0.diff)} tiap langkah.`,
    illustrationPrimitive: { name: 'PatternRow', props: { title: 'Pola bentuk', items: ['circle', 'square', 'triangle', 'circle', 'square'], highlightIndex: 4 } },
    widgetType: 'STEP_REVEAL',
    widgetParams: {
      steps: [
        { title: 'Amati barisan', body: `${first5.slice(0, 4).map(idNum).join(', ')}, ...` },
        { title: 'Cari selisih', body: `Setiap suku ${s0.diff > 0 ? 'bertambah' : 'berkurang'} ${idNum(Math.abs(s0.diff))}.` },
        { title: 'Terapkan aturan', body: `Suku ke-5 = ${idNum(first5[4])}.` },
      ],
    },
    videoTranscript: `Video menjelaskan cara menemukan aturan sebuah pola bilangan atau gambar dan melanjutkannya.`,
  });

  const questions: LessonQuestionInput[] = [];

  // O4 — placement of the next term.
  const next = term(s0.start, s0.diff, 6);
  const lo = Math.min(0, next - Math.abs(s0.diff) * 6);
  const hi = Math.max(next + Math.abs(s0.diff), lo + 10);
  const span = hi - lo;
  questions.push(
    numberLineQuestion({
      id: `${spec.id}-q1`,
      grade,
      promptText: `Barisan ${first5.map(idNum).join(', ')}, ... Letakkan suku berikutnya pada garis.`,
      min: lo,
      max: hi,
      step: span / 10,
      targetValue: next,
      tolerance: 0,
      explanation: `${idNum(first5[4])} ${s0.diff > 0 ? '+' : '-'} ${idNum(Math.abs(s0.diff))} = ${idNum(next)}.`,
      hints: [`Tambahkan selisih ${idNum(s0.diff)} ke suku terakhir.`],
      narrationText: young ? `Geser penanda ke angka setelah ${idNum(first5[4])}.` : undefined,
    }),
  );

  // O4 — grouping: which sequences increase vs decrease.
  const four = seqs.slice(0, 4);
  const mapping: Record<string, string> = {};
  four.forEach((s, i) => {
    mapping[`i${i}`] = s.diff > 0 ? 'up' : 'down';
  });
  if (new Set(Object.values(mapping)).size === 1) mapping.i0 = mapping.i0 === 'up' ? 'down' : 'up';
  questions.push(
    dragGroupQuestion({
      id: `${spec.id}-q2`,
      grade,
      promptText: `Kelompokkan pola: menaik atau menurun.`,
      items: four.map((s, i) => ({
        id: `i${i}`,
        label: `${idNum(term(s.start, s.diff, 1))}, ${idNum(term(s.start, s.diff, 2))}, ${idNum(term(s.start, s.diff, 3))}, ...`,
        ...(young ? { illustrationAssetId: `assets/lessons/sd/kelas-${grade}/pt/${spec.id}-i${i}.svg` } : {}),
      })),
      groups: [
        { id: 'up', label: 'Menaik' },
        { id: 'down', label: 'Menurun' },
      ],
      correctMapping: mapping,
      explanation: `Bandingkan dua suku pertama tiap barisan.`,
      hints: [`Kalau suku kedua lebih besar, polanya menaik.`],
      narrationText: young ? `Pisahkan pola yang naik dan yang turun.` : undefined,
    }),
  );

  for (let i = 0; i < count - 2; i += 1) {
    const s = at(seqs, i % seqs.length);
    const qid = `${spec.id}-q${i + 3}`;
    const shape = young ? i % 2 : i % 3;
    const shown = [1, 2, 3, 4].map((n) => term(s.start, s.diff, n)) as [number, number, number, number];

    if (shape === 0) {
      const answer = term(s.start, s.diff, 5);
      const opts = distinctNumericOptions(answer, [
        answer + s.diff,
        answer - s.diff,
        answer + 1,
        shown[3] + shown[3] - shown[2] + 1,
      ]).map((text, j) => ({ id: OPTLET(j), text }));
      questions.push(
        mcQuestion({
          id: qid,
          grade,
          promptText: `Lanjutkan pola: ${shown.map(idNum).join(', ')}, ...`,
          options: young
            ? opts.map((o) => ({ ...o, illustrationAssetId: `assets/lessons/sd/kelas-${grade}/pt/${qid}-${o.id}.svg` }))
            : opts,
          correctOptionId: 'a',
          explanation: `Selisih tetap ${idNum(s.diff)}, jadi setelah ${idNum(shown[3])} datang ${idNum(answer)}.`,
          hints: [`Cari selisih dua suku berurutan lalu tambahkan.`],
          narrationText: young ? `Angka berapa berikutnya?` : undefined,
        }),
      );
    } else if (shape === 1) {
      const missingIndex = 2; // third term hidden
      const answer = term(s.start, s.diff, missingIndex + 1);
      const withGap = [0, 1, 2, 3].map((n) => (n === missingIndex ? '__' : idNum(term(s.start, s.diff, n + 1))));
      const opts = distinctNumericOptions(answer, [answer + s.diff, answer - s.diff, answer + 2]).map(
        (text, j) => ({ id: OPTLET(j), text }),
      );
      questions.push(
        mcQuestion({
          id: qid,
          grade,
          promptText: `Lengkapi pola: ${withGap.join(', ')}`,
          options: young
            ? opts.map((o) => ({ ...o, illustrationAssetId: `assets/lessons/sd/kelas-${grade}/pt/${qid}-${o.id}.svg` }))
            : opts,
          correctOptionId: 'a',
          explanation: `Suku yang hilang = ${idNum(answer)} karena selisihnya ${idNum(s.diff)}.`,
          hints: [`Gunakan suku sebelum dan sesudah tempat kosong.`],
          narrationText: young ? `Angka apa yang hilang?` : undefined,
        }),
      );
    } else {
      const nth = 8;
      const answer = term(s.start, s.diff, nth);
      questions.push(
        shortAnswerQuestion({
          id: qid,
          grade,
          promptText: `Barisan mulai ${idNum(s.start)} dengan selisih ${idNum(s.diff)}. Berapa suku ke-${idNum(nth)}?`,
          acceptedAnswers: [String(answer), idNum(answer)],
          explanation: `Suku ke-${idNum(nth)} = ${idNum(s.start)} + ${idNum(s.diff)} x ${idNum(nth - 1)} = ${idNum(answer)}.`,
          hints: [`Suku ke-n = suku pertama + selisih x (n - 1).`],
        }),
      );
    }
  }

  return assembleLesson(spec, 'PATTERNS', blocks, questions);
}
