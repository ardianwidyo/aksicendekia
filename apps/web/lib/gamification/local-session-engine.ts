import {
  EducationStage,
  GuestStreak,
  GuestSessionRecord,
  GuestSessionAnswerRecord,
} from './guest-progress.schema';
import {
  gradeQuestion,
  normalizeAnswerText as canonicalNormalizeAnswerText,
} from '@aksicendekia/content-kit';

export interface QuestionEvaluationResult {
  isCorrect: boolean;
  explanation: string;
  correctAnswerText?: string;
}

export class LocalSessionEngine {
  /**
   * Normalisasi jawaban isian singkat \u2014 didelegasikan ke @aksicendekia/content-kit
   * agar Mode Tamu dan sesi terautentikasi memakai aturan yang sama persis.
   */
  public static normalizeAnswerText(input: string): string {
    return canonicalNormalizeAnswerText(input);
  }

  /**
   * Evaluasi jawaban butir soal di sisi klien (Mode Tamu). Logika penilaian
   * dibagi dengan server lewat @aksicendekia/content-kit; hanya `explanation`
   * yang diambil langsung dari payload konten publik.
   */
  public static evaluateAnswer(
    questionType:
      | 'MULTIPLE_CHOICE'
      | 'SHORT_ANSWER'
      | 'MATCHING_PAIRS'
      | 'DRAG_DROP_GROUPING'
      | 'NUMBER_LINE',
    contentPayload: any,
    userAnswer: any
  ): QuestionEvaluationResult {
    const { isCorrect, correctAnswerDetails } = gradeQuestion(
      questionType,
      contentPayload,
      userAnswer
    );

    const acceptedAnswers = (correctAnswerDetails as { acceptedAnswers?: string[] }).acceptedAnswers;

    return {
      isCorrect,
      explanation: contentPayload?.explanation || '',
      correctAnswerText: acceptedAnswers?.[0],
    };
  }

  /**
   * Menghitung perolehan XP berdasarkan skor dan jumlah soal
   */
  public static calculateXp(scorePercentage: number, correctCount: number): number {
    const basePointsPerQuestion = 10;
    let earned = correctCount * basePointsPerQuestion;

    // Bonus 20 XP untuk kesempurnaan (100% score)
    if (scorePercentage === 100 && correctCount > 0) {
      earned += 20;
    }

    return earned;
  }

  /**
   * Menghitung pembaruan streak harian lokal
   */
  public static updateStreak(currentStreak: GuestStreak): GuestStreak {
    const today = new Date().toISOString().split('T')[0];
    let streakCount = currentStreak.currentStreak;
    let longest = currentStreak.longestStreak;
    const history = [...currentStreak.activityHistory];

    if (!history.includes(today)) {
      history.push(today);
    }

    const lastDate = currentStreak.lastActivityDate;
    if (!lastDate) {
      streakCount = 1;
    } else {
      const last = new Date(lastDate);
      const now = new Date(today);
      const diffDays = Math.round((now.getTime() - last.getTime()) / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        streakCount += 1;
      } else if (diffDays > 1) {
        streakCount = 1;
      }
      // if diffDays === 0 (same day activity), streakCount remains the same
    }

    if (streakCount > longest) {
      longest = streakCount;
    }

    return {
      currentStreak: streakCount,
      longestStreak: longest,
      lastActivityDate: today,
      activityHistory: history,
    };
  }

  /**
   * Membangun record sesi pengerjaan soal lokal
   */
  public static buildSessionRecord(params: {
    lessonId: string;
    educationStage: EducationStage;
    totalQuestions: number;
    correctCount: number;
    startedAt: string;
    completedAt: string;
    timeSpentSeconds: number;
    answers: GuestSessionAnswerRecord[];
  }): GuestSessionRecord {
    const scorePercentage =
      params.totalQuestions > 0
        ? Math.min(100, Math.max(0, Math.round((params.correctCount / params.totalQuestions) * 100)))
        : 0;
    const xpEarned = LocalSessionEngine.calculateXp(scorePercentage, params.correctCount);

    return {
      sessionId:
        typeof crypto !== 'undefined' && crypto.randomUUID
          ? crypto.randomUUID()
          : 'sess_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9),
      lessonId: params.lessonId,
      educationStage: params.educationStage,
      totalQuestions: params.totalQuestions,
      correctCount: params.correctCount,
      scorePercentage,
      xpEarned,
      startedAt: params.startedAt,
      completedAt: params.completedAt,
      timeSpentSeconds: params.timeSpentSeconds,
      answers: params.answers,
    };
  }
}
