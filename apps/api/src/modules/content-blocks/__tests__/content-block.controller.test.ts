import { describe, it, expect, beforeEach } from "vitest";
import { Role, AccountStatus } from "@prisma/client";
import { createMockPrismaClient } from "../../../__tests__/mock-prisma.js";
import { buildApp } from "../../../app.js";

describe("content-blocks HTTP routes (contracts §1-8)", () => {
  let mockPrisma: any;
  let app: any;
  let adminToken: string;
  let lessonId: string;

  beforeEach(async () => {
    mockPrisma = createMockPrismaClient();
    app = buildApp(mockPrisma);
    await app.ready();
    adminToken = app.jwt.sign({ userId: "admin-1", role: Role.ADMIN, status: AccountStatus.ACTIVE });

    const unit = await mockPrisma.unit.create({ data: { subjectId: "s1", title: "Unit", orderIndex: 1 } });
    const lesson = await mockPrisma.lesson.create({
      data: {
        unitId: unit.id,
        title: "Pelajaran HTTP",
        summary: "Ringkasan",
        learningObjective: "Tujuan",
        educationStage: "SD",
        phase: "FASE_B",
        difficultyLevel: "BEGINNER",
        estimatedDurationMinutes: 10,
        orderIndex: 1,
        status: "DRAFT",
      },
    });
    lessonId = lesson.id;
  });

  it("401s without a token, 403s for a non-ADMIN token", async () => {
    const noAuth = await app.inject({ method: "GET", url: `/api/v1/admin/lessons/${lessonId}/blocks` });
    expect(noAuth.statusCode).toBe(401);

    const studentToken = app.jwt.sign({ userId: "s1", role: Role.SISWA, status: AccountStatus.ACTIVE });
    const forbidden = await app.inject({
      method: "GET",
      url: `/api/v1/admin/lessons/${lessonId}/blocks`,
      headers: { authorization: `Bearer ${studentToken}` },
    });
    expect(forbidden.statusCode).toBe(403);
  });

  it("creates, lists, updates, reorders, and deletes a block over HTTP", async () => {
    const create = await app.inject({
      method: "POST",
      url: `/api/v1/admin/lessons/${lessonId}/blocks`,
      headers: { authorization: `Bearer ${adminToken}` },
      payload: { orderIndex: 0, blockType: "RICH_TEXT", payload: { markdown: "Halo" } },
    });
    expect(create.statusCode).toBe(201);
    const block = JSON.parse(create.body);

    const list = await app.inject({
      method: "GET",
      url: `/api/v1/admin/lessons/${lessonId}/blocks`,
      headers: { authorization: `Bearer ${adminToken}` },
    });
    expect(list.statusCode).toBe(200);
    expect(JSON.parse(list.body).blocks).toHaveLength(1);

    const update = await app.inject({
      method: "PATCH",
      url: `/api/v1/admin/blocks/${block.id}`,
      headers: { authorization: `Bearer ${adminToken}` },
      payload: { altText: "Diperbarui" },
    });
    expect(update.statusCode).toBe(200);
    expect(JSON.parse(update.body).altText).toBe("Diperbarui");

    const second = await app.inject({
      method: "POST",
      url: `/api/v1/admin/lessons/${lessonId}/blocks`,
      headers: { authorization: `Bearer ${adminToken}` },
      payload: { orderIndex: 1, blockType: "RICH_TEXT", payload: { markdown: "Kedua" } },
    });
    const secondBlock = JSON.parse(second.body);

    const reorder = await app.inject({
      method: "PUT",
      url: `/api/v1/admin/lessons/${lessonId}/blocks/order`,
      headers: { authorization: `Bearer ${adminToken}` },
      payload: { orderedBlockIds: [secondBlock.id, block.id] },
    });
    expect(reorder.statusCode).toBe(200);
    expect(JSON.parse(reorder.body).blocks.map((b: any) => b.id)).toEqual([secondBlock.id, block.id]);

    const del = await app.inject({
      method: "DELETE",
      url: `/api/v1/admin/blocks/${block.id}`,
      headers: { authorization: `Bearer ${adminToken}` },
    });
    expect(del.statusCode).toBe(204);
  });

  it("400s a malformed block payload over HTTP", async () => {
    const res = await app.inject({
      method: "POST",
      url: `/api/v1/admin/lessons/${lessonId}/blocks`,
      headers: { authorization: `Bearer ${adminToken}` },
      payload: { orderIndex: 0, blockType: "RICH_TEXT", payload: { notMarkdown: true } },
    });
    expect(res.statusCode).toBe(400);
  });

  it("GET /api/v1/admin/widget-catalog returns the 7 SUPPORTED widgets", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/v1/admin/widget-catalog",
      headers: { authorization: `Bearer ${adminToken}` },
    });
    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body).widgets).toHaveLength(7);
  });

  it("creates and lists curriculum achievements over HTTP", async () => {
    const create = await app.inject({
      method: "POST",
      url: "/api/v1/admin/curriculum-achievements",
      headers: { authorization: `Bearer ${adminToken}` },
      payload: {
        educationStage: "SD",
        phase: "FASE_B",
        subjectCode: "MATH_SD",
        element: "Bilangan",
        achievementText: "Kutipan",
        sourceDocument: "Dok",
        sourceUrl: "https://kurikulum.kemdikbud.go.id/x",
        retrievedAt: "2026-09-01T00:00:00Z",
      },
    });
    expect(create.statusCode).toBe(201);

    const list = await app.inject({
      method: "GET",
      url: "/api/v1/admin/curriculum-achievements",
      headers: { authorization: `Bearer ${adminToken}` },
    });
    expect(JSON.parse(list.body).achievements).toHaveLength(1);
  });

  it("GET /api/v1/admin/media-assets lists registered assets", async () => {
    await mockPrisma.mediaAsset.create({
      data: { kind: "IMAGE", storageKey: "assets/x.svg", mimeType: "image/svg+xml", byteSize: 100, altText: "x" },
    });
    const res = await app.inject({
      method: "GET",
      url: "/api/v1/admin/media-assets",
      headers: { authorization: `Bearer ${adminToken}` },
    });
    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body).assets).toHaveLength(1);
  });

  it("submit-review 422s with structured violations, then 200s once compliant, then publish 200s", async () => {
    const achievement = await mockPrisma.curriculumAchievement.create({
      data: {
        educationStage: "SD",
        phase: "FASE_B",
        subjectCode: "MATH_SD",
        element: "Bilangan",
        achievementText: "Kutipan",
        sourceDocument: "Dok",
        sourceUrl: "https://kurikulum.kemdikbud.go.id/x",
        retrievedAt: new Date(),
      },
    });

    const failing = await app.inject({
      method: "POST",
      url: `/api/v1/admin/lessons/${lessonId}/submit-review`,
      headers: { authorization: `Bearer ${adminToken}` },
    });
    expect(failing.statusCode).toBe(422);
    const failingBody = JSON.parse(failing.body);
    expect(Array.isArray(failingBody.violations)).toBe(true);
    expect(failingBody.violations.length).toBeGreaterThan(0);

    await mockPrisma.lesson.update({ where: { id: lessonId }, data: { curriculumAchievementId: achievement.id } });
    await mockPrisma.lessonContentBlock.create({
      data: { lessonId, orderIndex: 0, blockType: "ILLUSTRATION", payload: {}, altText: "Ilustrasi", status: "DRAFT" },
    });
    await mockPrisma.lessonContentBlock.create({
      data: {
        lessonId,
        orderIndex: 1,
        blockType: "INTERACTIVE_WIDGET",
        payload: { widgetType: "NUMBER_LINE_EXPLORER", params: { min: 0, max: 10, step: 1, initial: 0 } },
        status: "DRAFT",
      },
    });

    const passing = await app.inject({
      method: "POST",
      url: `/api/v1/admin/lessons/${lessonId}/submit-review`,
      headers: { authorization: `Bearer ${adminToken}` },
    });
    expect(passing.statusCode).toBe(200);
    expect(JSON.parse(passing.body).status).toBe("REVIEW");

    const published = await app.inject({
      method: "POST",
      url: `/api/v1/admin/lessons/${lessonId}/publish`,
      headers: { authorization: `Bearer ${adminToken}` },
      payload: { reviewerNote: "Diperiksa" },
    });
    expect(published.statusCode).toBe(200);
    expect(JSON.parse(published.body).status).toBe("PUBLISHED");
  });
});
