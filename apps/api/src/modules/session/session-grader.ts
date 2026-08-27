export function normalizeAnswerText(input: string): string {
  if (!input) return '';
  return input
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase()
    .replace(/[.,!?]+$/, '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

export function gradeQuestion(
  questionType: 'MULTIPLE_CHOICE' | 'SHORT_ANSWER' | 'MATCHING_PAIRS',
  contentPayload: any,
  studentAnswer: any
): { isCorrect: boolean; correctAnswerDetails: any } {
  const payload = typeof contentPayload === 'string'
    ? JSON.parse(contentPayload)
    : contentPayload || {};

  if (questionType === 'MULTIPLE_CHOICE') {
    const correctOptionId = payload.correctOptionId ||
      payload.options?.find((o: any) => o.isCorrect)?.id ||
      payload.choices?.find((o: any) => o.isCorrect)?.id;
    const selectedOptionId = typeof studentAnswer === 'object' && studentAnswer !== null
      ? studentAnswer.selectedOptionId || studentAnswer.optionId || studentAnswer.id
      : studentAnswer;

    const isCorrect = Boolean(selectedOptionId && correctOptionId && selectedOptionId === correctOptionId);

    return {
      isCorrect,
      correctAnswerDetails: {
        correctOptionId
      }
    };
  }

  if (questionType === 'SHORT_ANSWER') {
    const rawInput = typeof studentAnswer === 'object' && studentAnswer !== null
      ? studentAnswer.text ?? studentAnswer.answer ?? ''
      : (typeof studentAnswer === 'string' ? studentAnswer : '');
    const acceptedAnswers: string[] = payload.acceptedAnswers || [];
    const matchingMode: 'EXACT' | 'CASE_INSENSITIVE' | 'NORMALIZED' = payload.matchingMode || 'NORMALIZED';

    let isCorrect = false;

    if (matchingMode === 'EXACT') {
      isCorrect = acceptedAnswers.some((acc) => acc === rawInput);
    } else if (matchingMode === 'CASE_INSENSITIVE') {
      const lowerInput = String(rawInput).trim().toLowerCase();
      isCorrect = acceptedAnswers.some((acc) => String(acc).trim().toLowerCase() === lowerInput);
    } else {
      // NORMALIZED (default)
      const normInput = normalizeAnswerText(String(rawInput));
      isCorrect = acceptedAnswers.some((acc) => normalizeAnswerText(String(acc)) === normInput);
    }

    return {
      isCorrect,
      correctAnswerDetails: {
        acceptedAnswers,
        matchingMode
      }
    };
  }

  if (questionType === 'MATCHING_PAIRS') {
    const studentPairs: Record<string, string> =
      (typeof studentAnswer === 'object' && studentAnswer !== null ? studentAnswer.pairs || studentAnswer : {}) || {};
    const rawPairs = payload.pairs || [];

    const expectedPairs: Record<string, string> = {};
    if (Array.isArray(rawPairs)) {
      rawPairs.forEach((p: { left: string; right: string }) => {
        if (p.left && p.right) expectedPairs[p.left] = p.right;
      });
    } else if (typeof rawPairs === 'object' && rawPairs !== null) {
      Object.assign(expectedPairs, rawPairs);
    }

    const expectedKeys = Object.keys(expectedPairs);
    let isCorrect = expectedKeys.length > 0;

    for (const key of expectedKeys) {
      if (studentPairs[key] !== expectedPairs[key]) {
        isCorrect = false;
        break;
      }
    }

    return {
      isCorrect,
      correctAnswerDetails: {
        matchingPairs: expectedPairs
      }
    };
  }

  return { isCorrect: false, correctAnswerDetails: {} };
}
