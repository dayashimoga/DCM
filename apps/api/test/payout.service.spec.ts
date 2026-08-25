import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PayoutService } from '../src/modules/payout/payout.service';
import { PrismaService } from '../src/modules/prisma/prisma.service';
import { RedisService } from '../src/modules/redis/redis.service';
import { PayoutDestinationType, PayoutStatus } from '@distributed-compute/shared-types';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('PayoutService Unit Tests', () => {
  let service: PayoutService;
  let mockPrisma: any;
  let mockRedis: any;

  const sampleProvider = {
    id: 'prov-777',
    email: 'host@gpu-farm.com',
    balanceUsd: 150.0,
  };

  const sampleNodes = [
    { id: 'node-1', providerId: 'prov-777', gpuModel: 'RTX 4090', gpuCount: 2 },
    { id: 'node-2', providerId: 'prov-777', gpuModel: 'H100', gpuCount: 2 },
  ];

  beforeEach(() => {
    mockPrisma = {
      user: {
        findUnique: vi.fn().mockResolvedValue(sampleProvider),
        update: vi.fn().mockResolvedValue(sampleProvider),
      },
      computeNode: {
        findMany: vi.fn().mockResolvedValue(sampleNodes),
      },
    };

    mockRedis = {
      getClient: vi.fn().mockReturnValue({
        lrange: vi.fn().mockResolvedValue([]),
        lpush: vi.fn().mockResolvedValue(1),
      }),
      isHealthy: vi.fn().mockResolvedValue(true),
    };

    service = new PayoutService(
      mockPrisma as PrismaService,
      mockRedis as RedisService,
    );
  });

  describe('getEarningsAnalytics()', () => {
    it('should return net earnings, active GPUs, and ROI yield forecast', async () => {
      const res = await service.getEarningsAnalytics('prov-777');
      expect(res.availablePayoutBalanceUsd).toBe(150.0);
      expect(res.activeGpuCount).toBe(4);
      expect(res.estimatedMonthlyYieldUsd).toBeGreaterThan(0);
      expect(res.destinations.length).toBeGreaterThan(0);
    });

    it('should throw NotFoundException if provider is missing', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      await expect(service.getEarningsAnalytics('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('requestPayout()', () => {
    it('should deduct balance and create payout request for amounts >= $50', async () => {
      const req = await service.requestPayout({
        providerId: 'prov-777',
        amountUsd: 100.0,
        destinationType: PayoutDestinationType.BANK_STRIPE_CONNECT,
      });

      expect(req.amountUsd).toBe(100.0);
      expect(req.netAmountUsd).toBe(98.50); // $100 - $1.50 fee
      expect(req.status).toBe(PayoutStatus.COMPLETED);
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 'prov-777' },
        data: { balanceUsd: { decrement: 100.0 } },
      });
    });

    it('should reject payouts under $50.00 threshold', async () => {
      await expect(
        service.requestPayout({
          providerId: 'prov-777',
          amountUsd: 25.0,
          destinationType: PayoutDestinationType.CRYPTO_USDC,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject payouts exceeding available balance', async () => {
      await expect(
        service.requestPayout({
          providerId: 'prov-777',
          amountUsd: 500.0,
          destinationType: PayoutDestinationType.CRYPTO_USDC,
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('addDestination()', () => {
    it('should store and return new payout destination', async () => {
      const dest = await service.addDestination({
        providerId: 'prov-777',
        type: PayoutDestinationType.CRYPTO_USDC,
        label: 'My Phantom Solana Wallet',
        target: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyT844e',
      });

      expect(dest.type).toBe(PayoutDestinationType.CRYPTO_USDC);
      expect(dest.label).toBe('My Phantom Solana Wallet');
    });
  });
});
