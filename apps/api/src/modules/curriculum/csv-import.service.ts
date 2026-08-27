import { QuestionType, MatchingMode, ContentStatus, Prisma } from "@prisma/client";

export interface CsvImportRowError {
  row: number;
  column: string;
  message: string;
}

export interface CsvImportReport {
  success: boolean;
  totalRows: number;
  passedRows: number;
  failedRows: number;
  errors: CsvImportRowError[];
  createdCount?: number;
}

export class CsvImportService {
  /**
   * Parse CSV content into structured rows.
   * Auto-detects comma (,) or semicolon (;) delimiter.
   */
  parseCsv(csvContent: string): { headers: string[]; rows: string[][] } {
    const lines = csvContent
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    if (lines.length === 0) {
      return { headers: [], rows: [] };
    }

    // Detect delimiter from first line
    const headerLine = lines[0];
    const delimiter = headerLine.includes(";") && !headerLine.includes(",") ? ";" : ",";

    const parseLine = (line: string): string[] => {
      const result: string[] = [];
      let current = "";
      let inQuotes = false;

      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"' || char === "'") {
          if (inQuotes && line[i + 1] === char) {
            current += char;
            i++;
          } else {
            inQuotes = !inQuotes;
          }
        } else if (char === delimiter && !inQuotes) {
          result.push(current.trim());
          current = "";
        } else {
          current += char;
        }
      }
      result.push(current.trim());
      return result;
    };

    const headers = parseLine(lines[0]).map((h) => h.toLowerCase());
    const rows = lines.slice(1).map(parseLine);

    return { headers, rows };
  }

  /**
   * Validate and transform parsed CSV rows into QuestionItem payload batch.
   */
  processCsvRows(
    lessonId: string,
    headers: string[],
    rows: string[][]
  ): {
    report: CsvImportReport;
    validPayloads: Array<{
      data: Prisma.QuestionItemCreateInput;
      hints: { stepOrder: number; hintText: string }[];
    }>;
  } {
    const errors: CsvImportRowError[] = [];
    const validPayloads: Array<{
      data: Prisma.QuestionItemCreateInput;
      hints: { stepOrder: number; hintText: string }[];
    }> = [];

    const getColIndex = (name: string): number => headers.indexOf(name.toLowerCase());

    const idxOrder = getColIndex("order_index");
    const idxType = getColIndex("question_type");
    const idxPrompt = getColIndex("prompt_text");
    const idxPayload = getColIndex("content_payload_json");
    const idxExplanation = getColIndex("explanation");
    const idxHints = getColIndex("hints_json");

    if (idxType === -1 || idxPrompt === -1 || idxPayload === -1) {
      return {
        report: {
          success: false,
          totalRows: rows.length,
          passedRows: 0,
          failedRows: rows.length,
          errors: [
            {
              row: 0,
              column: "header",
              message: "Header CSV wajib memuat kolom 'question_type', 'prompt_text', dan 'content_payload_json'",
            },
          ],
        },
        validPayloads: [],
      };
    }

    for (let i = 0; i < rows.length; i++) {
      const rowNum = i + 2; // 1-indexed (header is line 1)
      const row = rows[i];

      const rawOrder = idxOrder !== -1 ? row[idxOrder] : String(i + 1);
      const rawType = row[idxType]?.toUpperCase();
      const rawPrompt = row[idxPrompt];
      const rawPayload = row[idxPayload];
      const rawExplanation = idxExplanation !== -1 ? row[idxExplanation] : "Pembahasan jawaban benar.";
      const rawHints = idxHints !== -1 ? row[idxHints] : "[]";

      // 1. Validate Order Index
      const orderIndex = parseInt(rawOrder, 10);
      if (isNaN(orderIndex) || orderIndex < 1) {
        errors.push({
          row: rowNum,
          column: "order_index",
          message: "Indeks urutan harus berupa angka bulat positif",
        });
        continue;
      }

      // 2. Validate Question Type
      if (!Object.values(QuestionType).includes(rawType as QuestionType)) {
        errors.push({
          row: rowNum,
          column: "question_type",
          message: `Tipe soal '${rawType}' tidak valid. Harus salah satu dari: MULTIPLE_CHOICE, SHORT_ANSWER, MATCHING_PAIRS`,
        });
        continue;
      }
      const questionType = rawType as QuestionType;

      // 3. Validate Prompt
      if (!rawPrompt || rawPrompt.length < 3) {
        errors.push({
          row: rowNum,
          column: "prompt_text",
          message: "Teks soal tidak boleh kosong (minimal 3 karakter)",
        });
        continue;
      }

      // 4. Validate Content Payload JSON
      let contentPayload: any = null;
      try {
        contentPayload = JSON.parse(rawPayload);
      } catch (err) {
        errors.push({
          row: rowNum,
          column: "content_payload_json",
          message: "Format JSON pada content_payload_json tidak valid",
        });
        continue;
      }

      // Specific payload structure checks
      if (questionType === QuestionType.MULTIPLE_CHOICE) {
        if (!contentPayload?.choices || !Array.isArray(contentPayload.choices) || contentPayload.choices.length < 2) {
          errors.push({
            row: rowNum,
            column: "content_payload_json",
            message: "Pilihan Ganda membutuhkan array 'choices' dengan minimal 2 opsi",
          });
          continue;
        }
        const hasCorrect = contentPayload.choices.some((c: any) => c.isCorrect === true);
        if (!hasCorrect) {
          errors.push({
            row: rowNum,
            column: "content_payload_json",
            message: "Pilihan Ganda harus memiliki minimal 1 opsi dengan isCorrect: true",
          });
          continue;
        }
      } else if (questionType === QuestionType.SHORT_ANSWER) {
        if (!contentPayload?.acceptedAnswers || !Array.isArray(contentPayload.acceptedAnswers) || contentPayload.acceptedAnswers.length === 0) {
          errors.push({
            row: rowNum,
            column: "content_payload_json",
            message: "Isian Singkat membutuhkan array 'acceptedAnswers' dengan minimal 1 jawaban benar",
          });
          continue;
        }
        if (!contentPayload.matchingMode) {
          contentPayload.matchingMode = MatchingMode.NORMALIZED;
        }
      } else if (questionType === QuestionType.MATCHING_PAIRS) {
        if (!contentPayload?.pairs || !Array.isArray(contentPayload.pairs) || contentPayload.pairs.length < 2) {
          errors.push({
            row: rowNum,
            column: "content_payload_json",
            message: "Mencocokkan Pasangan membutuhkan array 'pairs' dengan minimal 2 pasang",
          });
          continue;
        }
      }

      // 5. Validate Hints JSON
      let parsedHints: any[] = [];
      try {
        if (rawHints) {
          parsedHints = JSON.parse(rawHints);
        }
      } catch (err) {
        errors.push({
          row: rowNum,
          column: "hints_json",
          message: "Format JSON pada hints_json tidak valid",
        });
        continue;
      }

      if (!Array.isArray(parsedHints) || parsedHints.length === 0) {
        // Fallback default hint if missing
        parsedHints = [{ stepOrder: 1, hintText: "Baca dengan teliti pertanyaan dan materi terkait." }];
      }

      const hints = parsedHints.map((h: any, idx: number) => ({
        stepOrder: typeof h.stepOrder === "number" ? h.stepOrder : idx + 1,
        hintText: typeof h === "string" ? h : h.hintText || `Petunjuk ${idx + 1}`,
      }));

      // Validated payload
      validPayloads.push({
        data: {
          lesson: { connect: { id: lessonId } },
          questionType,
          promptText: rawPrompt,
          contentPayload,
          explanation: rawExplanation,
          orderIndex,
          status: ContentStatus.PUBLISHED, // CSV mass import defaults to PUBLISHED for ready use
        },
        hints,
      });
    }

    const totalRows = rows.length;
    const failedRows = errors.length;
    const passedRows = totalRows - failedRows;
    const success = failedRows === 0;

    return {
      report: {
        success,
        totalRows,
        passedRows,
        failedRows,
        errors,
      },
      validPayloads,
    };
  }
}
