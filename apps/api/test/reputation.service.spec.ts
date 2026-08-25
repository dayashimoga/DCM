import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ReputationService } from '../src/modules/reputation/reputation.service';
import { PrismaService } from '../src/modules/prisma/prisma.service';
import { RedisService } from '../src/modules/redis/redis.service';
import {
  ProviderReputationBadge,
  DisputeReason,
  DisputeStatus,
} from '@distributed-compute/shared-types';

describe('ReputationService Unit Tests', () => {
  let service: ReputationService;
  let mockPrisma: any;
  let mockRedis: any;

  beforeEach(() => {
    mockPrisma = {
      computeNode: {
        findUnique: vi.fn().mockResolvedValue({
          id: 'node-101',
          reliabilityScore: 99.5,
        }),
      },
      provider: {
        findMany: vi.fn().mockResolvedValue([
          {
            id: 'prov-1',
            reputation: 99.2,
            user: { email: 'provider1@example.com' },
            nodes: [{ id: 'node-1', reliabilityScore: 99.2 }],
          },
        ]),
      },
      user: {
        update: vi.fn().mockResolvedValue({}),
      },
    };

    mockRedis = {
      getClient: vi.fn().mockReturnValue(null),
      isHealthy: vi.fn().mockResolvedValue(true),
    };

    service = new ReputationService(mockPrisma as PrismaService, mockRedis as RedisService);
  });

  describe('calculateBadge()', () => {
    it('should assign ELITE_PROVIDER to top tier nodes', () => {
      expect(service.calculateBadge(99.0, 30)).toBe(ProviderReputationBadge.ELITE_PROVIDER);
      expect(service.calculateBadge(92.0, 10)).toBe(ProviderReputationBadge.VERIFIED_PROVIDER);
      expect(service.calculateBadge(75.0, 5)).toBe(ProviderReputationBadge.PROBATION);
    });
  });

  describe('getNodeReliability()', () => {
    it('should return node reliability and SLA metrics', async () => {
      const res = await service.getNodeReliability('node-101');
      expect(res.nodeId).toBe('node-101');
      expect(res.compositeReliabilityScore).toBeGreaterThanOrEqual(95);
      expect(res.badge).toBe(ProviderReputationBadge.ELITE_PROVIDER);
    });
  });

  describe('submitDispute() & arbitrateDispute()', () => {
    it('should create dispute and arbitrate full refund', async () => {
      const dispute = await service.submitDispute('user-cust-1', {
        jobId: 'job-999',
        reason: DisputeReason.PREMATURE_TERMINATION,
        description: 'Node dropped offline midway through job',
        claimAmountUsd: 25.0,
      });

      expect(dispute.id).toBeDefined();
      expect(dispute.status).toBe(DisputeStatus.OPEN);

      const arbitrated = await service.arbitrateDispute(dispute.id, {
        status: DisputeStatus.RESOLVED_REFUNDED,
        arbitrationNotes: 'Heartbeat lost during container run. Approved.',
        refundedAmountUsd: 25.0,
      });

      expect(arbitrated.status).toBe(DisputeStatus.RESOLVED_REFUNDED);
      expect(arbitrated.refundedAmountUsd).toBe(25.0);
    });
  });

  describe('getSummary()', () => {
    it('should return network reputation and SLA overview', async () => {
      const summary = await service.getSummary();
      expect(summary.networkAvgReliability).toBeGreaterThanOrEqual(99.0);
      expect(summary.leaderboard.length).toBeGreaterThan(0);
      expect(summary.recentDisputes.length).toBeGreaterThan(0);
    });
  });
});
