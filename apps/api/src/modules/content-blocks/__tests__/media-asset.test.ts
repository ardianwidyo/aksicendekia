import { describe, it, expect, beforeEach } from "vitest";
import { createMockPrismaClient } from "../../../__tests__/mock-prisma.js";
import { ContentBlockRepository } from "../content-block.repository.js";
import { MediaAssetService } from "../media-asset.service.js";
import { BadRequestError, ConflictError, UnprocessableEntityError } from "../../../common/errors/app-error.js";

describe("MediaAssetService (contracts §6)", () => {
  let repo: ContentBlockRepository;
  let service: MediaAssetService;

  beforeEach(() => {
    repo = new ContentBlockRepository(createMockPrismaClient());
    service = new MediaAssetService(repo);
  });

  it("registers an IMAGE asset with a generated relative storageKey", async () => {
    const asset = await service.registerAsset({
      kind: "IMAGE",
      mimeType: "image/svg+xml",
      byteSize: 8_421,
      altText: "Batang puluhan dan satuan yang menyusun angka 45",
    });

    expect(asset.storageKey).not.toMatch(/^https?:\/\//);
    expect(asset.mimeType).toBe("image/svg+xml");
  });

  it("400s when mimeType is not allowed for the given kind", async () => {
    await expect(
      service.registerAsset({ kind: "IMAGE", mimeType: "application/pdf", byteSize: 1000, altText: "x" }),
    ).rejects.toThrow(BadRequestError);
  });

  it("400s when byteSize exceeds the 512KB image limit", async () => {
    await expect(
      service.registerAsset({
        kind: "IMAGE",
        mimeType: "image/png",
        byteSize: 512 * 1024 + 1,
        altText: "x",
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it("400s when byteSize exceeds the 2MB audio limit", async () => {
    await expect(
      service.registerAsset({ kind: "AUDIO", mimeType: "audio/mpeg", byteSize: 2 * 1024 * 1024 + 1 }),
    ).rejects.toThrow(BadRequestError);
  });

  it("400s when byteSize exceeds the 20MB video limit", async () => {
    await expect(
      service.registerAsset({ kind: "VIDEO", mimeType: "video/mp4", byteSize: 20 * 1024 * 1024 + 1 }),
    ).rejects.toThrow(BadRequestError);
  });

  it("400s when an IMAGE asset has no altText", async () => {
    await expect(service.registerAsset({ kind: "IMAGE", mimeType: "image/png", byteSize: 1000 })).rejects.toThrow(
      BadRequestError,
    );
  });

  it("400s when a VIDEO exceeds 180 seconds", async () => {
    await expect(
      service.registerAsset({ kind: "VIDEO", mimeType: "video/mp4", byteSize: 1000, durationSeconds: 181 }),
    ).rejects.toThrow(BadRequestError);
  });

  it("400s when an AUDIO narration slot exceeds 60 seconds", async () => {
    await expect(
      service.registerAsset({ kind: "AUDIO", mimeType: "audio/mpeg", byteSize: 1000, durationSeconds: 61 }),
    ).rejects.toThrow(BadRequestError);
  });

  it("422s when a client-supplied storageKey looks like an external URL", async () => {
    await expect(
      service.registerAsset({
        kind: "IMAGE",
        mimeType: "image/png",
        byteSize: 1000,
        altText: "x",
        storageKey: "https://cdn.example.com/hotlinked.png",
      }),
    ).rejects.toThrow(UnprocessableEntityError);
  });

  it("409s on a duplicate storageKey", async () => {
    await service.registerAsset({
      kind: "IMAGE",
      mimeType: "image/png",
      byteSize: 1000,
      altText: "x",
      storageKey: "assets/lessons/sd-01/place-value.svg",
    });
    await expect(
      service.registerAsset({
        kind: "IMAGE",
        mimeType: "image/png",
        byteSize: 1000,
        altText: "y",
        storageKey: "assets/lessons/sd-01/place-value.svg",
      }),
    ).rejects.toThrow(ConflictError);
  });
});
