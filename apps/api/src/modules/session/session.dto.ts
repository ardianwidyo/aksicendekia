import type { QuestionType } from '@prisma/client';

export interface ClientQuestionOption {
  id: string;
  text: string;
}

export interface ClientQuestionDTO {
  id: string;
  type: QuestionType;
  prompt: string;
  options?: ClientQuestionOption[];
  matchingItemsLeft?: string[];
  matchingItemsRight?: string[];
  availableHintsCount: number;
}

export interface AnswerEvaluationResultDTO {
  sessionId: string;
  questionId: string;
  isCorrect: boolean;
  explanation: string;
  correctAnswer: {
    correctOptionId?: string;
    acceptedAnswers?: string[];
    matchingPairs?: Record<string, string>;
    matchingMode?: string;
  };
  sessionProgress: {
    currentIndex: number;
    totalQuestions: number;
    isCompleted: boolean;
  };
}

export interface SessionSummaryDTO {
  sessionId: string;
  lessonId: string;
  status: string;
  score: number;
  totalQuestions: number;
  correctCount: number;
  incorrectCount: number;
  durationSeconds: number;
  completedAt: string | null;
  incorrectQuestionsSummary: Array<{
    questionId: string;
    prompt: string;
    studentAnswer: unknown;
    correctAnswer: unknown;
    explanation: string;
  }>;
}

export interface SessionHistoryItemDTO {
  sessionId: string;
  lessonTitle: string;
  subjectName: string;
  score: number | null;
  status: string;
  completedAt: string | null;
  durationSeconds: number;
}
