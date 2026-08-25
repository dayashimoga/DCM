import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PaymentService } from '../src/modules/payment/payment.service';
import { PrismaService } from '../src/modules/prisma/prisma.service';
import { RedisService } from '../src/modules/redis/redis.service';
import { PaymentMethod, EscrowStatus, TransactionType } from '@distributed-compute/shared-types';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('PaymentService Unit Tests', () => {
  let service: PaymentService;
  let mockPrisma: any;
  let mockRedis: any;

  const sampleUser = {
    id: 'user-777',
    email: 'trader@example.com',
    balanceUsd: 100.0,
  };

  const sampleEscrow = {
    id: 'escrow-job-999',
    jobId: 'job-999',
    customerId: 'user-777',
    providerId: 'prov-123',
    amountLockedUsd: 20.0,
    amountSettledUsd: 0,
    amountRefundedUsd: 0,
    status: EscrowStatus.HELD,
    createdAt: new Date().toISOString(),
  };

  beforeEach(() => {
    mockPrisma = {
      user: {
        findUnique: vi.fn().mockResolvedValue(sampleUser),
        update: vi.fn().mockResolvedValue(sampleUser),
      },
    };

    mockRedis = {
      getClient: vi.fn().mockReturnValue({
        lrange: vi.fn().mockResolvedValue([]),
        keys: vi.fn().mockResolvedValue([]),
        get: vi.fn().mockResolvedValue(JSON.stringify(sampleEscrow)),
        set: vi.fn().mockResolvedValue('OK'),
        lpush: vi.fn().mockResolvedValue(1),
      }),
      isHealthy: vi.fn().mockResolvedValue(true),
    };

    service = new PaymentService(
      mockPrisma as PrismaService,
      mockRedis as RedisService,
    );
  });

  describe('getWalletSummary()', () => {
    it('should return available balance and crypto deposit addresses', async () => {
      const summary = await service.getWalletSummary('user-777');
      expect(summary.availableBalanceUsd).toBe(100.0);
      expect(summary.cryptoAddresses.length).toBe(4);
      expect(summary.cryptoAddresses[0].symbol).toBe('USDC');
    });
  });

  describe('processDeposit()', () => {
    it('should credit user balance and record deposit transaction', async () => {
      const tx = await service.processDeposit({
        userId: 'user-777',
        amountUsd: 50.0,
        method: PaymentMethod.FIAT_STRIPE,
      });

      expect(tx.type).toBe(TransactionType.DEPOSIT);
      expect(tx.amountUsd).toBe(50.0);
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-777' },
        data: { balanceUsd: { increment: 50.0 } },
      });
    });
  });

  describe('lockEscrow()', () => {
    it('should lock estimated budget and deduct from available balance', async () => {
      const hold = await service.lockEscrow({
        jobId: 'job-999',
        customerId: 'user-777',
        providerId: 'prov-123',
        estimatedBudgetUsd: 25.0,
      });

      expect(hold.amountLockedUsd).toBe(25.0);
      expect(hold.status).toBe(EscrowStatus.HELD);
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-777' },
        data: { balanceUsd: { decrement: 25.0 } },
      });
    });

    it('should throw BadRequestException if balance is insufficient', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ ...sampleUser, balanceUsd: 5.0 });
      await expect(
        service.lockEscrow({
          jobId: 'job-999',
          customerId: 'user-777',
          providerId: 'prov-123',
          estimatedBudgetUsd: 50.0,
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('settleEscrow()', () => {
    it('should settle actual cost and refund unused escrow diff', async () => {
      // Locked $20.00, actual cost $12.50 -> Refund $7.50
      const settled = await service.settleEscrow({
        jobId: 'job-999',
        actualCostUsd: 12.50,
      });

      expect(settled.status).toBe(EscrowStatus.SETTLED);
      expect(settled.amountSettledUsd).toBe(12.50);
      expect(settled.amountRefundedUsd).toBe(7.50);
      expect(mockPrisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { balanceUsd: { increment: 7.50 } },
        }),
      );
    });
  });

  describe('refundEscrow()', () => {
    it('should refund 100% of locked funds on job cancellation', async () => {
      const refunded = await service.refundEscrow('job-999', 'Job cancelled early');
      expect(refunded.status).toBe(EscrowStatus.REFUNDED);
      expect(refunded.amountRefundedUsd).toBe(20.0);
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-777' },
        data: { balanceUsd: { increment: 20.0 } },
      });
    });
  });
});
