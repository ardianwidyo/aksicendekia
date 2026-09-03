import type { QuestionType } from '@prisma/client';

export interface ClientQuestionOption {
  id: string;
  text: string;
}

export interface ClientDragDropItem {
  id: string;
  label: string;
  illustrationAssetId?: string | null;
}

export interface ClientDragDropGroup {
  id: string;
  label: string;
}

export interface ClientQuestionDTO {
  id: string;
  type: QuestionType;
  prompt: string;
  options?: ClientQuestionOption[];
  matchingItemsLeft?: string[];
  matchingItemsRight?: string[];
  // DRAG_DROP_GROUPING (contracts/interactive-questions.contract.md §2) — correctMapping
  // is STRICTLY OMITTED, same anti-cheat rule as the other question types above.
  dragDropItems?: ClientDragDropItem[];
  dragDropGroups?: ClientDragDropGroup[];
  requireAllPlaced?: boolean;
  // NUMBER_LINE (§3) — targetValue and tolerance are STRICTLY OMITTED.
  numberLineMin?: number;
  numberLineMax?: number;
  numberLineStep?: number;
  numberLineMarkers?: number[];
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
    correctMapping?: Record<string, string>;
    targetValue?: number;
    tolerance?: number;
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
