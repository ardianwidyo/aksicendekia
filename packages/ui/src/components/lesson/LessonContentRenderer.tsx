'use client';

import React from 'react';
import { ListenButton } from '../a11y/ListenButton';
import { RichTextBlock } from './blocks/RichTextBlock';
import { IllustrationBlock } from './blocks/IllustrationBlock';
import { ConceptAnimationBlock } from './blocks/ConceptAnimationBlock';
import { VideoBlock } from './blocks/VideoBlock';
import { EmbeddedVideoBlock } from './blocks/EmbeddedVideoBlock';
import { InteractiveWidgetBlock } from './blocks/InteractiveWidgetBlock';

export type RenderableBlockType =
  | 'RICH_TEXT'
  | 'ILLUSTRATION'
  | 'ANIMATION'
  | 'VIDEO'
  | 'INTERACTIVE_WIDGET';

export interface RenderableBlock {
  id: string;
  blockType: RenderableBlockType;
  /** Shape depends on blockType; already resolved (asset ids -> urls) by the caller. */
  payload: Record<string, unknown>;
  narrationText?: string | null;
  narrationAssetUrl?: string | null;
}

export interface LessonContentRendererProps {
  blocks: RenderableBlock[];
  /** Named-frame renderer for ANIMATION blocks (T042 wires real SVGs). */
  renderFrame?: (frameId: string) => React.ReactNode;
  onBlockInteract?: (blockId: string) => void;
}

export const LessonContentRenderer: React.FC<LessonContentRendererProps> = ({
  blocks,
  renderFrame,
  onBlockInteract,
}) => {
  return (
    <div className="space-y-5">
      {blocks.map((block) => {
        const p = block.payload;
        let body: React.ReactNode = null;

        switch (block.blockType) {
          case 'RICH_TEXT':
            body = <RichTextBlock markdown={String(p.markdown ?? '')} />;
            break;
          case 'ILLUSTRATION':
            body = (
              <IllustrationBlock
                imageUrl={String(p.imageUrl ?? '')}
                altText={String(p.altText ?? '')}
                caption={p.caption ? String(p.caption) : undefined}
                fallbackText={p.fallbackText ? String(p.fallbackText) : undefined}
                primitive={
                  p.illustrationPrimitive as
                    | { name: string; props: Record<string, unknown> }
                    | undefined
                }
              />
            );
            break;
          case 'ANIMATION':
            body = (
              <ConceptAnimationBlock
                animationId={String(p.animationId ?? '')}
                steps={(p.steps as ConceptAnimationBlockSteps) ?? []}
                loop={Boolean(p.loop)}
                transcriptText={String(p.transcriptText ?? '')}
                renderFrame={renderFrame}
              />
            );
            break;
          case 'VIDEO': {
            // Feature 011 — a block carries at most one of `videoEmbed`
            // (third-party, click-to-load) or `videoUrl` (self-hosted).
            const embed = p.videoEmbed as VideoEmbedPayload | undefined;
            body = embed ? (
              <EmbeddedVideoBlock
                title={embed.title}
                externalId={embed.externalId}
                publisherName={embed.publisherName}
                posterImageUrl={embed.posterUrl}
                transcriptText={embed.transcriptText}
                durationSeconds={embed.durationSeconds}
              />
            ) : (
              <VideoBlock
                title={String(p.title ?? '')}
                videoUrl={String(p.videoUrl ?? '')}
                captionUrl={String(p.captionUrl ?? '')}
                transcriptText={String(p.transcriptText ?? '')}
                fallbackImageUrl={p.fallbackImageUrl ? String(p.fallbackImageUrl) : undefined}
              />
            );
            break;
          }
          case 'INTERACTIVE_WIDGET': {
            const widget = (p.widget ?? {}) as { widgetType?: string; params?: unknown };
            body = (
              <InteractiveWidgetBlock
                widgetType={String(widget.widgetType ?? '')}
                params={widget.params}
                fallbackNote={p.fallbackText ? String(p.fallbackText) : undefined}
                onInteract={onBlockInteract ? () => onBlockInteract(block.id) : undefined}
              />
            );
            break;
          }
          default:
            body = null;
        }

        return (
          <section key={block.id} aria-label={block.blockType}>
            {block.narrationText && (
              <div className="mb-2">
                <ListenButton
                  text={block.narrationText}
                  narrationAssetUrl={block.narrationAssetUrl ?? undefined}
                />
              </div>
            )}
            {body}
          </section>
        );
      })}
    </div>
  );
};

type ConceptAnimationBlockSteps = Array<{ atMs: number; caption: string; frame: string }>;

/** Feature 011 — shape of `payload.videoEmbed`, matching contracts/public-api.md. */
interface VideoEmbedPayload {
  externalId: string;
  title: string;
  publisherName: string;
  posterUrl: string;
  transcriptText: string;
  durationSeconds?: number;
}
