import { ContentStatus } from "@prisma/client";
import { ContentBlockRepository } from "./content-block.repository.js";
import { runAccessibilityGate } from "./accessibility-gate.js";
import { runCurriculumGate } from "./curriculum-gate.js";
import { ConflictError, NotFoundError, UnprocessableEntityError } from "../../common/errors/app-error.js";
import type { GateViolation } from "./gate-types.js";

/**
 * THE ONLY path that may write status = PUBLISHED (FR-030a). Seeds, migrations, and
 * scheduled scripts must never call `lesson.update({ status: 'PUBLISHED' })` directly —
 * see __tests__/publish-authority.spec.ts, which statically asserts this.
 */
export class PublishService {
  constructor(private repo: ContentBlockRepository) {}

  async submitForReview(lessonId: string): Promise<{ lessonId: string; status: ContentStatus }> {
    const lesson = await this.repo.findLessonStatus(lessonId);
    if (!lesson) throw new NotFoundError("Pelajaran tidak ditemukan");
    if (lesson.status === ContentStatus.PUBLISHED) {
      throw new ConflictError("Pelajaran berstatus PUBLISHED — sunting memerlukan versi baru");
    }

    const violations = await this.runGates(lessonId);
    if (violations.length > 0) {
      throw new UnprocessableEntityError(
        "Pelajaran belum memenuhi syarat untuk diajukan ke review.",
        "ACCESSIBILITY_GATE_FAILED",
        violations,
      );
    }

    await this.repo.updateLessonStatus(lessonId, ContentStatus.REVIEW);
    return { lessonId, status: ContentStatus.REVIEW };
  }

  async publish(lessonId: string, reviewerNote?: string): Promise<{ lessonId: string; status: ContentStatus }> {
    const lesson = await this.repo.findLessonStatus(lessonId);
    if (!lesson) throw new NotFoundError("Pelajaran tidak ditemukan");
    if (lesson.status !== ContentStatus.REVIEW) {
      throw new ConflictError("Hanya pelajaran berstatus REVIEW yang dapat diterbitkan");
    }

    const violations = await this.runGates(lessonId);
    if (violations.length > 0) {
      throw new UnprocessableEntityError(
        "Konten berubah sejak diajukan dan tidak lagi lolos gerbang penerbitan.",
        "ACCESSIBILITY_GATE_FAILED",
        violations,
      );
    }

    await this.repo.updateLessonStatus(lessonId, ContentStatus.PUBLISHED, reviewerNote);
    return { lessonId, status: ContentStatus.PUBLISHED };
  }

  private async runGates(lessonId: string): Promise<GateViolation[]> {
    const snapshot = await this.repo.getGateSnapshot(lessonId);
    if (!snapshot) throw new NotFoundError("Pelajaran tidak ditemukan");
    return [...runAccessibilityGate(snapshot), ...runCurriculumGate(snapshot)];
  }
}
