/**
 * Feature 010 / T090 (FR-030b). Defense-in-depth startup check: the content
 * preview switch must never be on in production. `public-content.controller.ts`
 * already ignores the switch outside a non-production NODE_ENV, so this can never
 * actually leak REVIEW content — but a production deploy that was accidentally
 * configured with the switch on should fail loudly at boot, not silently rely on
 * that inline check.
 */
export function assertProductionPreviewGuards(env: NodeJS.ProcessEnv = process.env): void {
  if (env.NODE_ENV !== "production") return;

  if (env.CONTENT_PREVIEW_INCLUDE_REVIEW === "true") {
    throw new Error(
      "FR-030b violation: CONTENT_PREVIEW_INCLUDE_REVIEW=true is set in a production environment. " +
        "Refusing to start — unset it or set NODE_ENV to a non-production value.",
    );
  }
}
