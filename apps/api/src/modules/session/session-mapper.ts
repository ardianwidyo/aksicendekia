import type { QuestionType } from '@prisma/client';
import { ClientQuestionDTO } from './session.dto';

interface QuestionItemRecord {
  id: string;
  questionType: QuestionType;
  promptText: string;
  contentPayload: any;
  hints?: Array<{ id: string }>;
}

export function toClientQuestionDTO(question: QuestionItemRecord): ClientQuestionDTO {
  const payload = typeof question.contentPayload === 'string'
    ? JSON.parse(question.contentPayload)
    : question.contentPayload || {};

  const dto: ClientQuestionDTO = {
    id: question.id,
    type: question.questionType,
    prompt: question.promptText,
    availableHintsCount: question.hints ? question.hints.length : 0
  };

  if (question.questionType === 'MULTIPLE_CHOICE') {
    const rawOptions = payload.options || payload.choices || [];
    dto.options = rawOptions.map((opt: any) => ({
      id: opt.id,
      text: opt.text
    }));
  } else if (question.questionType === 'MATCHING_PAIRS') {
    const rawPairs = payload.pairs || [];
    const leftItems: string[] = [];
    const rightItems: string[] = [];

    rawPairs.forEach((pair: { left: string; right: string }) => {
      if (pair.left) leftItems.push(pair.left);
      if (pair.right) rightItems.push(pair.right);
    });

    // Deterministic/Random shuffle right items so right column is not in order
    const shuffledRight = [...rightItems].sort(() => 0.5 - Math.random());

    dto.matchingItemsLeft = leftItems;
    dto.matchingItemsRight = shuffledRight;
  }

  // NOTE: STRICTLY OMIT correct_option_id, accepted_answers, matching_mode, matching_pairs, explanation
  return dto;
}
