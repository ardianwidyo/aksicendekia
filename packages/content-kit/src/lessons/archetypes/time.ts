import type { InteractiveLesson, LessonQuestionInput } from '../types.js';
import {
  ArchetypeSpecBase,
  DEFAULT_QUESTION_COUNT,
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
  passOf,
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
  const count = spec.questionCount ?? DEFAULT_QUESTION_COUNT;
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

  const tmAsset = (q: string, id: string): string => `assets/lessons/sd/kelas-${grade}/tm/${q}-${id}.svg`;
  const partOfDay = (h: number): string => (h < 11 ? 'Pagi' : h < 15 ? 'Siang' : h < 18 ? 'Sore' : 'Malam');
  const youngForms = ['read', 'earlier', 'partOfDay', 'toNextHour', 'read', 'earlier', 'partOfDay'] as const;
  const olderForms = [
    'read', 'earlier', 'toNextHour', 'duration', 'partOfDay',
    'minutesPast', 'later30', 'earlier', 'read', 'toNextHour', 'partOfDay', 'duration',
  ] as const;
  const forms = young ? youngForms : olderForms;

  for (let i = 0; i < count - 2; i += 1) {
    const p = passOf(i, forms.length);
    const t = at(times, i % times.length);
    let li = (i + 1 + p) % times.length;
    if (li === i % times.length) li = (li + 1) % times.length;
    const later = at(times, li);
    const qid = `${spec.id}-q${i + 3}`;
    let form: string = at(forms, i % forms.length);
    if (form === 'duration' && durations.length === 0) form = 'read';

    if (form === 'duration') {
      const [sh, sm, dur] = at(durations, (i + p) % durations.length);
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
    } else if (form === 'later30') {
      const endTotal = t.h * 60 + t.m + 30;
      const eh = Math.floor(endTotal / 60) % 24;
      const em = endTotal % 60;
      questions.push(
        shortAnswerQuestion({
          id: qid,
          grade,
          promptText: `Pukul ${hhmm(t.h, t.m)}, 30 menit kemudian pukul berapa? (format 00.00)`,
          acceptedAnswers: [hhmm(eh, em), `${eh}.${String(em).padStart(2, '0')}`, `${eh}:${String(em).padStart(2, '0')}`],
          explanation: `${hhmm(t.h, t.m)} + 30 menit = ${hhmm(eh, em)}.`,
          hints: [`Tambahkan 30 ke menitnya; bila 60 atau lebih, tambah 1 jam.`],
        }),
      );
    } else if (form === 'toNextHour') {
      const rem = t.m === 0 ? 60 : 60 - t.m;
      const opts = distinctNumericOptions(rem, [t.m, rem + 5, rem - 5, 30]).map((text, j) => ({
        id: OPTLET(j),
        text,
      }));
      questions.push(
        mcQuestion({
          id: qid,
          grade,
          promptText: `Sekarang pukul ${hhmm(t.h, t.m)}. Berapa menit lagi menuju jam berikutnya?`,
          options: young ? opts.map((o) => ({ ...o, illustrationAssetId: tmAsset(qid, o.id) })) : opts,
          correctOptionId: 'a',
          explanation: `Dari ${idNum(t.m)} menit menuju 60 menit perlu ${idNum(rem)} menit lagi.`,
          hints: [`Hitung selisih menitnya dengan 60.`],
          narrationText: young ? `Berapa menit lagi ke jam berikutnya?` : undefined,
        }),
      );
    } else if (form === 'minutesPast') {
      const opts = distinctNumericOptions(t.m, [t.m + 5, Math.max(0, t.m - 5), 60 - t.m, t.m + 10]).map(
        (text, j) => ({ id: OPTLET(j), text }),
      );
      questions.push(
        mcQuestion({
          id: qid,
          grade,
          promptText: `Pukul ${hhmm(t.h, t.m)} berarti berapa menit lewat dari jam ${idNum(t.h % 12 || 12)}?`,
          options: young ? opts.map((o) => ({ ...o, illustrationAssetId: tmAsset(qid, o.id) })) : opts,
          correctOptionId: 'a',
          explanation: `Jarum panjang di ${idNum(t.m)} berarti ${idNum(t.m)} menit lewat.`,
          hints: [`Baca angka yang ditunjuk jarum panjang, tiap angka 5 menit.`],
          narrationText: young ? `Berapa menit lewat dari jamnya?` : undefined,
        }),
      );
    } else if (form === 'partOfDay') {
      const label = partOfDay(t.h);
      const wrongs = ['Pagi', 'Siang', 'Sore', 'Malam'].filter((l) => l !== label).slice(0, 2);
      const opts = [
        { id: 'a', text: label },
        { id: 'b', text: at(wrongs, 0) },
        { id: 'c', text: at(wrongs, 1) },
      ];
      questions.push(
        mcQuestion({
          id: qid,
          grade,
          promptText: `Pukul ${hhmm(t.h, t.m)} termasuk waktu...`,
          options: young ? opts.map((o) => ({ ...o, illustrationAssetId: tmAsset(qid, o.id) })) : opts,
          correctOptionId: 'a',
          explanation: `Pukul ${hhmm(t.h, t.m)} berada pada ${label.toLowerCase()} hari.`,
          hints: [`Pagi < 11.00, siang 11.00–14.59, sore 15.00–17.59, selebihnya malam.`],
          narrationText: young ? `Pagi, siang, sore, atau malam?` : undefined,
        }),
      );
    } else if (form === 'earlier') {
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
          options: young ? uniq.map((o) => ({ ...o, illustrationAssetId: tmAsset(qid, o.id) })) : uniq,
          correctOptionId: 'a',
          explanation: `${hhmm(earlier.h, earlier.m)} terjadi lebih dulu dalam sehari.`,
          hints: [`Ubah ke menit sejak pukul 00.00 lalu bandingkan.`],
          narrationText: young ? `Pilih waktu yang lebih dulu.` : undefined,
        }),
      );
    } else {
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
          options: young ? opts.map((o) => ({ ...o, illustrationAssetId: tmAsset(qid, o.id) })) : opts,
          correctOptionId: 'a',
          explanation: `Jam ${idNum(t.h % 12 || 12)} lewat ${idNum(t.m)} menit ditulis ${hhmm(t.h, t.m)}.`,
          hints: [`Baca jam dari jarum pendek, menit dari jarum panjang.`],
          narrationText: young ? `Pukul berapa yang ditunjukkan jam?` : undefined,
        }),
      );
    }
  }

  return assembleLesson(spec, 'TIME', blocks, questions);
}
