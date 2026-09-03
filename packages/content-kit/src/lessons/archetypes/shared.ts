import type {
  InteractiveLesson,
  IllustrationPrimitiveRef,
  LessonArchetypeId,
  LessonBlockInput,
  LessonQuestionInput,
  SdGradeLevel,
} from '../types.js';
import type { CurriculumPhase } from '../../curriculum/achievements.js';
import type { AnimationId } from '../../schema/widget-params.schema.js';

/**
 * Feature 011 (contracts/lesson-authoring.md) — the shared spine of the 10
 * lesson archetypes. Every `makeXxxLesson` factory is pure and deterministic:
 * it maps a data spec to an `InteractiveLesson` and routes the result through
 * `assembleLesson`, which enforces guarantees O1-O12 so a class-file author
 * cannot forget one. No `Math.random`, no `Date.now`, no I/O anywhere here.
 */

export const ASSET_ROOT = 'assets/lessons/sd';

/** Grade<->phase consistency (data-model.md 1): 1,2 -> A; 3,4 -> B; 5,6 -> C. */
export function phaseForGrade(grade: SdGradeLevel): CurriculumPhase {
  if (grade <= 2) return 'FASE_A';
  if (grade <= 4) return 'FASE_B';
  return 'FASE_C';
}

export function isYoungGrade(grade: SdGradeLevel): boolean {
  return grade <= 2;
}

/** Storage-key helpers - every media block gets a real, self-hosted fallback (O7). */
export function assetKey(grade: SdGradeLevel, slug: string): string {
  return `${ASSET_ROOT}/kelas-${grade}/${slug}.svg`;
}
export function fallbackKey(grade: SdGradeLevel, slug: string): string {
  return `${ASSET_ROOT}/kelas-${grade}/${slug}-fallback.svg`;
}

/** Fields every archetype spec shares (contracts/lesson-authoring.md). */
export interface ArchetypeSpecBase {
  id: string;
  gradeLevel: SdGradeLevel;
  curriculumAchievementId: string;
  unitTitle: string;
  title: string;
  summary: string;
  learningObjective: string;
  orderIndex: number;
  videoEmbedId: string;
  difficultyLevel?: InteractiveLesson['difficultyLevel'];
  estimatedDurationMinutes?: number;
  /** Override the default 12 generated practice items (must stay >= 10, O3). */
  questionCount?: number;
}

// --- question builders -----------------------------------------------------
// Each one bakes in O5 (explanation + >=1 staged hint). For kelas 1-2 they also
// bake in O8: a per-option picture companion and a `narrationText`.

export interface McOption {
  id: string;
  text: string;
  illustrationAssetId?: string;
}

const OPTION_LETTERS = ['a', 'b', 'c', 'd', 'e', 'f'] as const;

/** Strict element access (repo runs `noUncheckedIndexedAccess`). */
export function at<T>(arr: readonly T[], i: number): T {
  const v = arr[i];
  if (v === undefined) throw new Error(`Indeks ${i} di luar rentang (panjang ${arr.length}).`);
  return v;
}

export function req<T>(v: T | undefined, msg = 'nilai wajib ada'): T {
  if (v === undefined) throw new Error(msg);
  return v;
}

/** Turn an ordered list of option texts into `a`, `b`, `c`, ... MC options. */
export function toOptions(texts: readonly string[]): McOption[] {
  return texts.map((text, i) => ({ id: at(OPTION_LETTERS, i), text }));
}

function requireStagedHints(
  id: string,
  hints: string[],
): Array<{ stepOrder: number; hintText: string }> {
  if (hints.length === 0) throw new Error(`O5: soal "${id}" tidak punya petunjuk bertahap.`);
  return hints.map((hintText, i) => ({ stepOrder: i + 1, hintText }));
}

function requireExplanation(id: string, explanation: string): string {
  if (explanation.trim().length === 0) throw new Error(`O5: soal "${id}" tidak punya explanation.`);
  return explanation;
}

function guardYoung(grade: SdGradeLevel, id: string, narrationText: string | undefined): void {
  if (isYoungGrade(grade) && !narrationText?.trim()) {
    throw new Error(`O8: soal kelas ${grade} "${id}" wajib punya narrationText.`);
  }
}

export function mcQuestion(input: {
  id: string;
  grade: SdGradeLevel;
  promptText: string;
  options: McOption[];
  correctOptionId: string;
  explanation: string;
  hints: string[];
  narrationText?: string;
}): LessonQuestionInput {
  const { id, grade, options, correctOptionId } = input;
  if (options.length < 2) throw new Error(`soal "${id}" butuh >=2 opsi.`);
  if (!options.some((o) => o.id === correctOptionId)) {
    throw new Error(`soal "${id}": correctOptionId "${correctOptionId}" tidak ada di opsi.`);
  }
  const texts = options.map((o) => o.text.trim().toLowerCase());
  if (new Set(texts).size !== texts.length) throw new Error(`soal "${id}": ada opsi duplikat.`);
  guardYoung(grade, id, input.narrationText);
  if (isYoungGrade(grade) && !options.every((o) => o.illustrationAssetId)) {
    throw new Error(`O8: soal kelas ${grade} "${id}" - setiap opsi wajib punya illustrationAssetId.`);
  }
  return {
    id,
    questionType: 'MULTIPLE_CHOICE',
    promptText: input.promptText,
    contentPayload: {
      options,
      correctOptionId,
      explanation: requireExplanation(id, input.explanation),
      ...(input.narrationText ? { narrationText: input.narrationText } : {}),
    },
    explanation: input.explanation,
    hints: requireStagedHints(id, input.hints),
  };
}

export function shortAnswerQuestion(input: {
  id: string;
  grade: SdGradeLevel;
  promptText: string;
  acceptedAnswers: string[];
  explanation: string;
  hints: string[];
}): LessonQuestionInput {
  const { id, grade } = input;
  if (isYoungGrade(grade)) {
    throw new Error(
      `O8: kelas ${grade} "${id}" - SHORT_ANSWER dilarang untuk kelas 1-2 (harus pilihan bergambar).`,
    );
  }
  if (input.acceptedAnswers.length === 0) throw new Error(`soal "${id}": acceptedAnswers kosong.`);
  return {
    id,
    questionType: 'SHORT_ANSWER',
    promptText: input.promptText,
    contentPayload: {
      acceptedAnswers: input.acceptedAnswers,
      matchingMode: 'NORMALIZED',
      explanation: requireExplanation(id, input.explanation),
    },
    explanation: input.explanation,
    hints: requireStagedHints(id, input.hints),
  };
}

export function numberLineQuestion(input: {
  id: string;
  grade: SdGradeLevel;
  promptText: string;
  min: number;
  max: number;
  step: number;
  targetValue: number;
  tolerance?: number;
  explanation: string;
  hints: string[];
  narrationText?: string;
}): LessonQuestionInput {
  const { id, min, max, step, targetValue } = input;
  if (max <= min) throw new Error(`soal "${id}": max harus > min.`);
  if (targetValue < min || targetValue > max) {
    throw new Error(`soal "${id}": targetValue ${targetValue} di luar [${min}, ${max}].`);
  }
  if ((max - min) / step > 100) throw new Error(`soal "${id}": (max-min)/step > 100.`);
  guardYoung(input.grade, id, input.narrationText);
  return {
    id,
    questionType: 'NUMBER_LINE',
    promptText: input.promptText,
    contentPayload: {
      min,
      max,
      step,
      targetValue,
      tolerance: input.tolerance ?? 0,
      explanation: requireExplanation(id, input.explanation),
      ...(input.narrationText ? { narrationText: input.narrationText } : {}),
    },
    explanation: input.explanation,
    hints: requireStagedHints(id, input.hints),
  };
}

export interface GroupItem {
  id: string;
  label: string;
  illustrationAssetId?: string;
}

export function dragGroupQuestion(input: {
  id: string;
  grade: SdGradeLevel;
  promptText: string;
  items: GroupItem[];
  groups: Array<{ id: string; label: string }>;
  correctMapping: Record<string, string>;
  explanation: string;
  hints: string[];
  narrationText?: string;
}): LessonQuestionInput {
  const { id, grade, items, groups, correctMapping } = input;
  // O12 - object/zone counts stay tappable at 320px (44x44 targets, no crowding).
  const maxItems = isYoungGrade(grade) ? 4 : 6;
  const maxGroups = isYoungGrade(grade) ? 2 : 3;
  if (items.length < 2 || items.length > maxItems) {
    throw new Error(
      `O12: soal "${id}" - jumlah objek ${items.length} di luar batas 2..${maxItems} untuk kelas ${grade}.`,
    );
  }
  if (groups.length < 2 || groups.length > maxGroups) {
    throw new Error(
      `O12: soal "${id}" - jumlah grup ${groups.length} di luar batas 2..${maxGroups} untuk kelas ${grade}.`,
    );
  }
  for (const it of items) {
    if (!(it.id in correctMapping)) {
      throw new Error(`soal "${id}": objek "${it.id}" tidak ada di correctMapping.`);
    }
    if (!groups.some((g) => g.id === correctMapping[it.id])) {
      throw new Error(`soal "${id}": correctMapping["${it.id}"] menunjuk grup tak dikenal.`);
    }
  }
  guardYoung(grade, id, input.narrationText);
  if (isYoungGrade(grade) && !items.every((it) => it.illustrationAssetId)) {
    throw new Error(`O8: kelas ${grade} "${id}" - setiap objek DRAG_DROP wajib punya illustrationAssetId.`);
  }
  return {
    id,
    questionType: 'DRAG_DROP_GROUPING',
    promptText: input.promptText,
    contentPayload: {
      items,
      groups,
      correctMapping,
      requireAllPlaced: true,
      explanation: requireExplanation(id, input.explanation),
      ...(input.narrationText ? { narrationText: input.narrationText } : {}),
    },
    explanation: input.explanation,
    hints: requireStagedHints(id, input.hints),
  };
}

// --- content-block builders ----------------------------------------------

export function illustrationBlock(input: {
  grade: SdGradeLevel;
  slug: string;
  caption: string;
  altText: string;
  narrationText?: string;
  /** The parametric primitive that actually depicts the concept (falls back to the SVG on load error). */
  primitive?: IllustrationPrimitiveRef;
}): LessonBlockInput {
  if (!input.altText.trim()) throw new Error(`O6: ilustrasi "${input.slug}" tanpa altText.`);
  return {
    blockType: 'ILLUSTRATION',
    payload: { caption: input.caption },
    altText: input.altText,
    mediaStorageKey: assetKey(input.grade, input.slug),
    fallbackStorageKey: fallbackKey(input.grade, input.slug),
    ...(input.primitive ? { illustrationPrimitive: input.primitive } : {}),
    ...(isYoungGrade(input.grade)
      ? { narrationText: input.narrationText ?? input.caption }
      : input.narrationText
        ? { narrationText: input.narrationText }
        : {}),
  };
}

export function animationBlock(input: {
  grade: SdGradeLevel;
  slug: string;
  animationId: AnimationId;
  steps: Array<{ atMs: number; caption: string; frame: string }>;
  transcriptText: string;
  narrationText?: string;
}): LessonBlockInput {
  if (input.steps.length < 1) throw new Error(`animasi "${input.slug}" tanpa langkah.`);
  if (!input.transcriptText.trim()) throw new Error(`O6: animasi "${input.slug}" tanpa transkrip.`);
  return {
    blockType: 'ANIMATION',
    payload: { animationId: input.animationId, steps: input.steps },
    transcriptText: input.transcriptText,
    fallbackStorageKey: fallbackKey(input.grade, input.slug),
    ...(isYoungGrade(input.grade)
      ? { narrationText: input.narrationText ?? input.transcriptText }
      : input.narrationText
        ? { narrationText: input.narrationText }
        : {}),
  };
}

export function widgetBlock(input: {
  grade: SdGradeLevel;
  widgetType: string;
  params: Record<string, unknown>;
  narrationText?: string;
}): LessonBlockInput {
  return {
    blockType: 'INTERACTIVE_WIDGET',
    payload: { widget: { widgetType: input.widgetType, params: input.params } },
    ...(isYoungGrade(input.grade)
      ? { narrationText: input.narrationText ?? 'Coba gerakkan dan amati apa yang berubah.' }
      : input.narrationText
        ? { narrationText: input.narrationText }
        : {}),
  };
}

export function embedVideoBlock(input: {
  grade: SdGradeLevel;
  slug: string;
  videoEmbedId: string;
  title: string;
  transcriptText: string;
  narrationText?: string;
}): LessonBlockInput {
  if (!input.videoEmbedId.trim()) throw new Error(`O2: blok VIDEO "${input.slug}" tanpa videoEmbedId.`);
  if (!input.transcriptText.trim()) throw new Error(`O6: blok VIDEO "${input.slug}" tanpa transkrip.`);
  return {
    blockType: 'VIDEO',
    payload: { title: input.title },
    videoEmbedId: input.videoEmbedId,
    transcriptText: input.transcriptText,
    fallbackStorageKey: fallbackKey(input.grade, `${input.slug}-video`),
    ...(isYoungGrade(input.grade)
      ? { narrationText: input.narrationText ?? input.transcriptText }
      : input.narrationText
        ? { narrationText: input.narrationText }
        : {}),
  };
}

// --- assembly + guarantee enforcement ----------------------------------

const INTERACTIVE_QUESTION_TYPES = new Set(['DRAG_DROP_GROUPING', 'NUMBER_LINE']);

export function assembleLesson(
  spec: ArchetypeSpecBase,
  archetype: LessonArchetypeId,
  contentBlocks: LessonBlockInput[],
  questions: LessonQuestionInput[],
): InteractiveLesson {
  const kinds = new Set(contentBlocks.map((b) => b.blockType));
  for (const required of ['ILLUSTRATION', 'ANIMATION', 'INTERACTIVE_WIDGET', 'VIDEO'] as const) {
    if (!kinds.has(required)) {
      throw new Error(`O2: pelajaran "${spec.id}" tidak punya blok ${required}.`);
    }
  }
  const minQ = spec.questionCount ?? 12;
  if (minQ < 10) throw new Error(`O3: questionCount "${spec.id}" (${minQ}) < 10.`);
  if (questions.length < 10) {
    throw new Error(`O3: pelajaran "${spec.id}" hanya menghasilkan ${questions.length} soal (< 10).`);
  }
  if (!questions.some((q) => INTERACTIVE_QUESTION_TYPES.has(q.questionType))) {
    throw new Error(`O4: pelajaran "${spec.id}" tanpa soal DRAG_DROP_GROUPING/NUMBER_LINE.`);
  }
  const qIds = questions.map((q) => q.id);
  if (new Set(qIds).size !== qIds.length) {
    throw new Error(`pelajaran "${spec.id}": id soal duplikat.`);
  }
  // VIDEO blocks in this feature are third-party embeds - never self-hosted files.
  for (const block of contentBlocks) {
    if (block.blockType === 'VIDEO' && block.mediaStorageKey) {
      throw new Error(`pelajaran "${spec.id}": blok VIDEO tidak boleh punya mediaStorageKey (harus sematan).`);
    }
  }

  return {
    id: spec.id,
    educationStage: 'SD',
    phase: phaseForGrade(spec.gradeLevel),
    subjectCode: 'MATH_SD',
    subjectName: 'Matematika',
    unitTitle: spec.unitTitle,
    title: spec.title,
    summary: spec.summary,
    learningObjective: spec.learningObjective,
    curriculumAchievementId: spec.curriculumAchievementId,
    difficultyLevel:
      spec.difficultyLevel ??
      (spec.gradeLevel <= 2 ? 'BEGINNER' : spec.gradeLevel <= 4 ? 'INTERMEDIATE' : 'ADVANCED'),
    estimatedDurationMinutes: spec.estimatedDurationMinutes ?? 12,
    orderIndex: spec.orderIndex,
    status: 'REVIEW', // O1 - never PUBLISHED
    listing: 'LISTED',
    contentBlocks,
    questions,
    gradeLevel: spec.gradeLevel,
    archetype,
  };
}

/**
 * The 4 concept blocks every archetype emits (O2): one ANIMATION, one
 * ILLUSTRATION, one INTERACTIVE_WIDGET, one embedded VIDEO — in that order.
 */
export function buildStandardBlocks(input: {
  spec: ArchetypeSpecBase;
  animationId: AnimationId;
  animationSteps: Array<{ atMs: number; caption: string; frame: string }>;
  animationTranscript: string;
  illustrationCaption: string;
  illustrationAlt: string;
  /** The parametric primitive the ILLUSTRATION block renders (concrete concept visual). */
  illustrationPrimitive?: IllustrationPrimitiveRef;
  widgetType: string;
  widgetParams: Record<string, unknown>;
  videoTranscript: string;
}): LessonBlockInput[] {
  const { spec } = input;
  const grade = spec.gradeLevel;
  return [
    animationBlock({
      grade,
      slug: `${spec.id}-anim`,
      animationId: input.animationId,
      steps: input.animationSteps,
      transcriptText: input.animationTranscript,
    }),
    illustrationBlock({
      grade,
      slug: `${spec.id}-fig`,
      caption: input.illustrationCaption,
      altText: input.illustrationAlt,
      primitive: input.illustrationPrimitive,
    }),
    widgetBlock({ grade, widgetType: input.widgetType, params: input.widgetParams }),
    embedVideoBlock({
      grade,
      slug: spec.id,
      videoEmbedId: spec.videoEmbedId,
      title: `Video: ${spec.title}`,
      transcriptText: input.videoTranscript,
    }),
  ];
}

/** Small deterministic helpers shared by number-heavy archetypes. */
export function digitAt(n: number, placeFromRight: number): number {
  return Math.floor(Math.abs(n) / 10 ** placeFromRight) % 10;
}
export function placeValueOf(n: number, placeFromRight: number): number {
  return digitAt(n, placeFromRight) * 10 ** placeFromRight;
}
export const PLACE_NAMES = [
  'satuan',
  'puluhan',
  'ratusan',
  'ribuan',
  'puluh ribuan',
  'ratus ribuan',
] as const;

/** Cycle a base list to length n deterministically (no RNG). */
export function cycle<T>(base: readonly T[], n: number): T[] {
  const out: T[] = [];
  for (let i = 0; i < n; i += 1) out.push(at(base, i % base.length));
  return out;
}

/**
 * Deterministic Indonesian thousands formatting (`3482` -> `"3.482"`).
 * Not `toLocaleString` — a Node build without full ICU would format it
 * differently, breaking both determinism guarantees and downstream tests.
 */
export function idNum(n: number): string {
  const neg = n < 0;
  const abs = Math.abs(n);
  const intPart = Math.trunc(abs);
  const digits = String(intPart);
  let out = '';
  for (let i = 0; i < digits.length; i += 1) {
    if (i > 0 && (digits.length - i) % 3 === 0) out += '.';
    out += digits[i];
  }
  const frac = abs - intPart;
  if (frac > 1e-9) {
    // Indonesian decimal comma, up to 3 dp, trailing zeros trimmed.
    out += `,${frac.toFixed(3).slice(2).replace(/0+$/, '')}`;
  }
  return neg ? `-${out}` : out;
}

/** Lowest place-from-right whose digit is non-zero, preferring `preferred`. */
export function pickNonZeroPlace(n: number, preferred: number): number {
  const len = String(Math.abs(n)).length;
  if (preferred < len && digitAt(n, preferred) !== 0) return preferred;
  for (let p = len - 1; p >= 0; p -= 1) {
    if (digitAt(n, p) !== 0) return p;
  }
  return 0;
}

/** Three distinct MC option texts: the key plus two derived distractors, never equal to the key. */
export function distinctNumericOptions(correct: number, candidates: number[]): string[] {
  const seen = new Set<number>([correct]);
  const picked: number[] = [];
  for (const c of candidates) {
    if (!seen.has(c) && Number.isFinite(c)) {
      seen.add(c);
      picked.push(c);
    }
    if (picked.length === 2) break;
  }
  let bump = 1;
  while (picked.length < 2) {
    const c = correct + bump * (correct === 0 ? 1 : Math.max(1, Math.abs(correct)));
    if (!seen.has(c)) {
      seen.add(c);
      picked.push(c);
    }
    bump += 1;
  }
  return [correct, ...picked].map((v) => idNum(v));
}
