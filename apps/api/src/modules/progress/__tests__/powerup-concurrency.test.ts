import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ProgressRepository } from '../progress.repository';

describe('ProgressRepository - Power-up Concurrency Safety', () => {
  let prismaMock: any;
  let repository: ProgressRepository;

  beforeEach(() => {
    prismaMock = {
      studentPowerup: {
        updateMany: vi.fn(),
        findUnique: vi.fn()
      },
      powerupTransaction: {
        create: vi.fn().mockResolvedValue({})
      }
    };

    repository = new ProgressRepository(prismaMock);
  });

  it('harus mengonsumsi powerup secara atomik jika saldo mencukupi', async () => {
    prismaMock.studentPowerup.updateMany.mockResolvedValue({ count: 1 });
    prismaMock.studentPowerup.findUnique.mockResolvedValue({ quantity: 2 });

    const remaining = await repository.consumePowerupAtomic('usr-1', 'HINT_TOKEN', 1);

    expect(remaining).toBe(2);
    expect(prismaMock.studentPowerup.updateMany).toHaveBeenCalledWith({
      where: {
        studentId: 'usr-1',
        powerupType: 'HINT_TOKEN',
        quantity: { gte: 1 }
      },
      data: {
        quantity: { decrement: 1 }
      }
    });
  });

  it('harus melempar error INSUFFICIENT_POWERUP dan membatalkan transaksi jika count = 0 (saldo habis / race condition)', async () => {
    prismaMock.studentPowerup.updateMany.mockResolvedValue({ count: 0 });

    await expect(
      repository.consumePowerupAtomic('usr-1', 'HINT_TOKEN', 1)
    ).rejects.toThrow('INSUFFICIENT_POWERUP: Saldo HINT_TOKEN tidak mencukupi');

    expect(prismaMock.powerupTransaction.create).not.toHaveBeenCalled();
  });
});
