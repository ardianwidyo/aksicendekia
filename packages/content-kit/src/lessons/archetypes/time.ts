import type { InteractiveLesson, LessonQuestionInput } from '../types.js';
import {
  ArchetypeSpecBase,
  assembleLesson,
  assetKey,
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
 * `time` archetype — clock reading, calendar and duration. Widget: IMAGE_HOTSPOT.
 * Kelas 1-4.
 */
export interface TimeLessonSpec extends ArchetypeSpecBase {
  params: {
    /** Clock times to read (24h hours 0-23, minutes multiple of 5). */
    times: Array<{ h: number; m: number }>;
    /** [startH, startM, durationMinutes] for duration questions. */
    durations?: Array<[number, number, number]>;
  };
}

const hhmm = (h: number, m: number): string => `${String(h).padStart(2, '0')}.${String(m).padStart(2, '0')}`;

export function makeTimeLesson(spec: TimeLessonSpec): InteractiveLesson {
  const { gradeLevel: grade } = spec;
  const { times } = spec.params;
  if (times.length < 4) throw new Error(`${spec.id}: time butuh >= 4 waktu.`);
  const durations = spec.params.durations ?? [];
  const count = spec.questionCount ?? 12;
  const young = isYoungGrade(grade);
  const t0 = at(times, 0);

  const blocks = buildStandardBlocks({
    spec,
    animationId: 'count-objects',
    animationSteps: [
      { atMs: 0, caption: `Jarum pendek menunjuk ${idNum(t0.h % 12 || 12)}.`, frame: 'hour' },
      { atMs: 600, caption: `Jarum panjang menunjuk ${idNum(t0.m)} menit.`, frame: 'minute' },
      { atMs: 1200, caption: `Waktunya pukul ${hhmm(t0.h, t0.m)}.`, frame: 'read' },
    ],
    animationTranscript: `Animasi menggerakkan jarum jam ke posisi pukul ${hhmm(t0.h, t0.m)} sambil menjelaskan arti jarum pendek dan panjang.`,
    illustrationCaption: `Muka jam analog menunjukkan pukul ${hhmm(t0.h, t0.m)}.`,
    illustrationAlt: `Gambar jam dinding dengan jarum pendek di angka ${idNum(t0.h % 12 || 12)} dan jarum panjang menunjuk ${idNum(t0.m)} menit.`,
    illustrationPrimitive: { name: 'ClockFace', props: { title: `Pukul ${hhmm(t0.h, t0.m)}`, hour: t0.h, minute: t0.m } },
    widgetType: 'IMAGE_HOTSPOT',
    widgetParams: {
      mediaAssetId: assetKey(grade, `${spec.id}-clock`),
      hotspots: [
        { id: 'short', xPercent: 50, yPercent: 32, label: 'Jarum pendek', body: 'Menunjukkan jam.' },
        { id: 'long', xPercent: 66, yPercent: 50, label: 'Jarum panjang', body: 'Menunjukkan menit.' },
        { id: 'twelve', xPercent: 50, yPercent: 12, label: 'Angka 12', body: 'Titik awal menghitung menit.' },
      ],
    },
    videoTranscript: `Video mengajarkan membaca jam analog, mengenal pagi/siang/sore/malam, dan menghitung durasi.`,
  });

  const questions: LessonQuestionInput[] = [];

  // O4 — placement: minutes past the hour on a 0..60 line.
  questions.push(
    numberLineQuestion({
      id: `${spec.id}-q1`,
      grade,
      promptText: `Pukul ${hhmm(t0.h, t0.m)} berarti berapa menit lewat dari jam ${idNum(t0.h % 12 || 12)}? Letakkan pada garis.`,
      min: 0,
      max: 60,
      step: 5,
      targetValue: t0.m,
      explanation: `Jarum panjang di ${idNum(t0.m)} berarti ${idNum(t0.m)} menit lewat.`,
      hints: [`Tiap angka pada jam berjarak 5 menit.`],
      narrationText: young ? `Geser penanda ke ${idNum(t0.m)} menit.` : undefined,
    }),
  );

  // O4 — grouping times into pagi (<12) vs siang/sore (>=12).
  const four = times.slice(0, 4);
  const mapping: Record<string, string> = {};
  four.forEach((t, i) => {
    mapping[`i${i}`] = t.h < 12 ? 'pagi' : 'siang';
  });
  if (new Set(Object.values(mapping)).size === 1) mapping.i0 = mapping.i0 === 'pagi' ? 'siang' : 'pagi';
  questions.push(
    dragGroupQuestion({
      id: `${spec.id}-q2`,
      grade,
      promptText: `Kelompokkan waktu: pagi (sebelum pukul 12) atau siang/sore (pukul 12 ke atas).`,
      items: four.map((t, i) => ({
        id: `i${i}`,
        label: hhmm(t.h, t.m),
        ...(young ? { illustrationAssetId: `assets/lessons/sd/kelas-${grade}/tm/${spec.id}-i${i}.svg` } : {}),
      })),
      groups: [
        { id: 'pagi', label: 'Pagi' },
        { id: 'siang', label: 'Siang / sore' },
      ],
      correctMapping: mapping,
      explanation: `Sebelum pukul 12.00 = pagi; pukul 12.00 ke atas = siang atau sore.`,
      hints: [`Lihat angka jamnya.`],
      narrationText: young ? `Pisahkan waktu pagi dan siang.` : undefined,
    }),
  );

  for (let i = 0; i < count - 2; i += 1) {
    const t = at(times, i % times.length);
    const qid = `${spec.id}-q${i + 3}`;
    const wantDuration = !young && durations.length > 0 && i % 3 === 2;

    if (wantDuration) {
      const [sh, sm, dur] = at(durations, i % durations.length);
      const endTotal = sh * 60 + sm + dur;
      const eh = Math.floor(endTotal / 60) % 24;
      const em = endTotal % 60;
      questions.push(
        shortAnswerQuestion({
          id: qid,
          grade,
          promptText: `Kegiatan mulai pukul ${hhmm(sh, sm)} selama ${idNum(dur)} menit. Pukul berapa selesai? (format 00.00)`,
          acceptedAnswers: [hhmm(eh, em), `${eh}.${String(em).padStart(2, '0')}`, `${eh}:${String(em).padStart(2, '0')}`],
          explanation: `${hhmm(sh, sm)} + ${idNum(dur)} menit = ${hhmm(eh, em)}.`,
          hints: [`Tambahkan menit dulu; bila lewat 60, tambah 1 jam.`],
        }),
      );
    } else if (i % 2 === 0) {
      const opts = [
        { id: 'a', text: hhmm(t.h, t.m) },
        { id: 'b', text: hhmm(t.h, (t.m + 15) % 60) },
        { id: 'c', text: hhmm((t.h + 1) % 24, t.m) },
      ];
      questions.push(
        mcQuestion({
          id: qid,
          grade,
          promptText: `Jarum pendek di ${idNum(t.h % 12 || 12)} dan jarum panjang menunjuk ${idNum(t.m)} menit. Pukul berapa?`,
          options: young
            ? opts.map((o) => ({ ...o, illustrationAssetId: `assets/lessons/sd/kelas-${grade}/tm/${qid}-${o.id}.svg` }))
            : opts,
          correctOptionId: 'a',
          explanation: `Jam ${idNum(t.h % 12 || 12)} lewat ${idNum(t.m)} menit ditulis ${hhmm(t.h, t.m)}.`,
          hints: [`Baca jam dari jarum pendek, menit dari jarum panjang.`],
          narrationText: young ? `Pukul berapa yang ditunjukkan jam?` : undefined,
        }),
      );
    } else {
      const later = at(times, (i + 1) % times.length);
      const tMin = t.h * 60 + t.m;
      const lMin = later.h * 60 + later.m;
      const earlier = tMin <= lMin ? t : later;
      const opts = [
        { id: 'a', text: hhmm(earlier.h, earlier.m) },
        { id: 'b', text: hhmm(earlier === t ? later.h : t.h, earlier === t ? later.m : t.m) },
        { id: 'c', text: hhmm((earlier.h + 2) % 24, earlier.m) },
      ];
      const seen = new Set<string>();
      const uniq = opts.filter((o) => (seen.has(o.text) ? false : (seen.add(o.text), true)));
      while (uniq.length < 2) uniq.push({ id: OPTLET(uniq.length), text: hhmm((earlier.h + uniq.length + 3) % 24, earlier.m) });
      questions.push(
        mcQuestion({
          id: qid,
          grade,
          promptText: `Manakah waktu yang lebih awal: ${hhmm(t.h, t.m)} atau ${hhmm(later.h, later.m)}?`,
          options: young
            ? uniq.map((o) => ({ ...o, illustrationAssetId: `assets/lessons/sd/kelas-${grade}/tm/${qid}-${o.id}.svg` }))
            : uniq,
          correctOptionId: 'a',
          explanation: `${hhmm(earlier.h, earlier.m)} terjadi lebih dulu dalam sehari.`,
          hints: [`Ubah ke menit sejak pukul 00.00 lalu bandingkan.`],
          narrationText: young ? `Pilih waktu yang lebih dulu.` : undefined,
        }),
      );
    }
  }

  return assembleLesson(spec, 'TIME', blocks, questions);
}
