import { Prisma, PrismaClient } from '@prisma/client';
import { randomUUID } from 'crypto';

export interface DomainEventPayload {
  eventId?: string;
  eventType: string;
  aggregateId: string;
  aggregateType?: string;
  timestamp?: string;
  payload: Record<string, unknown>;
}

export class OutboxPublisher {
  /**
   * Records a domain event inside a Prisma transaction (or standalone Prisma client)
   */
  static async publishEvent(
    tx: Prisma.TransactionClient | PrismaClient,
    event: DomainEventPayload
  ): Promise<void> {
    const eventId = event.eventId || randomUUID();
    const timestamp = event.timestamp || new Date().toISOString();
    const aggregateType = event.aggregateType || 'LearningSession';

    const fullPayload = {
      eventId,
      eventType: event.eventType,
      aggregateId: event.aggregateId,
      timestamp,
      payload: event.payload
    };

    await tx.outboxEvent.create({
      data: {
        id: eventId,
        aggregateType,
        aggregateId: event.aggregateId,
        eventType: event.eventType,
        payload: fullPayload as unknown as Prisma.InputJsonValue,
        published: false
      }
    });
  }
}
