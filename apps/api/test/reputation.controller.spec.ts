import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ReputationController } from '../src/modules/reputation/reputation.controller';
import { ReputationService } from '../src/modules/reputation/reputation.service';
import {
  ProviderReputationBadge,
  DisputeReason,
  DisputeStatus,
} from '@distributed-compute/shared-types';

describe('ReputationController Unit Tests', () => {
  let controller: ReputationController;
  let mockService: Partial<ReputationService>;

  beforeEach(() => {
    mockService = {
      getSummary: vi.fn().mockResolvedValue({
        networkAvgReliability: 99.5,
        eliteProviderCount: 4,
        totalDisputesResolved: 2,
        slaProtectionActivePercent: 100.0,
        leaderboard: [],
        recentDisputes: [],
      }),
      getLeaderboard: vi.fn().mockResolvedValue([
        {
          providerId: 'prov-1',
          providerEmail: 'test@provider.io',
          totalNodes: 3,
          reputationScore: 99.8,
          badge: ProviderReputationBadge.ELITE_PROVIDER,
          totalCompletedJobs: 120,
          uptimeAvgPercent: 99.9,
        },
      ]),
      getNodeReliability: vi.fn().mockResolvedValue({
        nodeId: 'node-101',
        uptimePercent30d: 99.9,
        jobCompletionRatePercent: 99.5,
        slaViolationCount: 0,
        compositeReliabilityScore: 99.7,
        badge: ProviderReputationBadge.ELITE_PROVIDER,
      }),
      submitDispute: vi.fn().mockResolvedValue({
        id: 'dsp-101',
        jobId: 'job-101',
        customerId: 'user-1',
        providerId: 'prov-1',
        nodeId: 'node-1',
        reason: DisputeReason.PREMATURE_TERMINATION,
        description: 'Node died',
        claimAmountUsd: 10,
        status: DisputeStatus.OPEN,
        createdAt: new Date().toISOString(),
      }),
      arbitrateDispute: vi.fn().mockResolvedValue({
        id: 'dsp-101',
        jobId: 'job-101',
        customerId: 'user-1',
        providerId: 'prov-1',
        nodeId: 'node-1',
        reason: DisputeReason.PREMATURE_TERMINATION,
        description: 'Node died',
        claimAmountUsd: 10,
        refundedAmountUsd: 10,
        status: DisputeStatus.RESOLVED_REFUNDED,
        createdAt: new Date().toISOString(),
        resolvedAt: new Date().toISOString(),
      }),
    };

    controller = new ReputationController(mockService as ReputationService);
  });

  it('should delegate getSummary call', async () => {
    const res = await controller.getSummary();
    expect(res.networkAvgReliability).toBe(99.5);
  });

  it('should delegate getLeaderboard call', async () => {
    const res = await controller.getLeaderboard();
    expect(res[0].badge).toBe(ProviderReputationBadge.ELITE_PROVIDER);
  });

  it('should delegate getNodeReliability call', async () => {
    const res = await controller.getNodeReliability('node-101');
    expect(res.compositeReliabilityScore).toBe(99.7);
  });

  it('should delegate submitDispute call', async () => {
    const res = await controller.submitDispute({
      jobId: 'job-101',
      reason: DisputeReason.PREMATURE_TERMINATION,
      description: 'Host down',
      claimAmountUsd: 10,
    });
    expect(res.status).toBe(DisputeStatus.OPEN);
  });

  it('should delegate arbitrateDispute call', async () => {
    const res = await controller.arbitrateDispute('dsp-101', {
      status: DisputeStatus.RESOLVED_REFUNDED,
      arbitrationNotes: 'Confirmed refund',
      refundedAmountUsd: 10,
    });
    expect(res.status).toBe(DisputeStatus.RESOLVED_REFUNDED);
  });
});
