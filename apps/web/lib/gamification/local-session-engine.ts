import {
  EducationStage,
  GuestStreak,
  GuestSessionRecord,
  GuestSessionAnswerRecord,
} from './guest-progress.schema';

export interface QuestionEvaluationResult {
  isCorrect: boolean;
  explanation: string;
  correctAnswerText?: string;
}

export class LocalSessionEngine {
  /**
   * Normalisasi string jawaban isian singkat toleran sesuai standar AksiCendekia
   */
  public static normalizeAnswerText(input: string): string {
    if (!input) return '';
    return input
      .trim()
      .replace(/\s+/g, ' ')
      .toLowerCase()
      .replace(/[.,!?;:]+$/, '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  }

  /**
   * Evaluasi jawaban butir soal di sisi klien
   */
  public static evaluateAnswer(
    questionType: 'MULTIPLE_CHOICE' | 'SHORT_ANSWER' | 'MATCHING_PAIRS',
    contentPayload: any,
    userAnswer: any
  ): QuestionEvaluationResult {
    let isCorrect = false;

    if (questionType === 'MULTIPLE_CHOICE') {
      const correctOptionId = contentPayload.correct_option_id;
      isCorrect = String(userAnswer).trim() === String(correctOptionId).trim();
    } else if (questionType === 'SHORT_ANSWER') {
      const normalizedUser = LocalSessionEngine.normalizeAnswerText(String(userAnswer || ''));
      const mode = contentPayload.matching_mode || 'NORMALIZED';

      if (mode === 'EXACT') {
        const accepted = (contentPayload.accepted_answers || []).map((a: string) => a.trim());
        isCorrect = accepted.includes(String(userAnswer).trim());
      } else if (mode === 'CASE_INSENSITIVE') {
        const accepted = (contentPayload.accepted_answers || []).map((a: string) => a.trim().toLowerCase());
        isCorrect = accepted.includes(String(userAnswer).trim().toLowerCase());
      } else {
        // NORMALIZED
        const acceptedNormalized = (contentPayload.accepted_answers || []).map((a: string) =>
          LocalSessionEngine.normalizeAnswerText(a)
        );
        isCorrect = acceptedNormalized.includes(normalizedUser);
      }
    } else if (questionType === 'MATCHING_PAIRS') {
      const correctPairs = contentPayload.matching_pairs || [];
      if (typeof userAnswer === 'object' && userAnswer !== null) {
        let matchAll = true;
        for (const pair of correctPairs) {
          if (userAnswer[pair.left] !== pair.right) {
            matchAll = false;
            break;
          }
        }
        isCorrect = matchAll && Object.keys(userAnswer).length === correctPairs.length;
      }
    }

    return {
      isCorrect,
      explanation: contentPayload.explanation || '',
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
      params.totalQuestions > 0 ? Math.round((params.correctCount / params.totalQuestions) * 100) : 0;
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
