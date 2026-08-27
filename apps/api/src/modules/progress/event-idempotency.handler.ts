import { PrismaClient, Prisma } from '@prisma/client';

export class EventIdempotencyHandler {
  constructor(private prisma: PrismaClient) {}

  async isEventProcessed(eventId: string, tx?: Prisma.TransactionClient): Promise<boolean> {
    const client = tx || this.prisma;
    const existing = await client.processedEventLog.findUnique({
      where: { eventId }
    });
    return !!existing;
  }

  async markEventProcessed(
    eventId: string,
    eventType: string,
    aggregateId: string,
    tx?: Prisma.TransactionClient
  ): Promise<void> {
    const client = tx || this.prisma;
    await client.processedEventLog.create({
      data: {
        eventId,
        eventType,
        aggregateId
      }
    });
  }
}
