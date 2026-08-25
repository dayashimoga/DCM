import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BenchmarkController } from '../src/modules/benchmark/benchmark.controller';
import { BenchmarkService } from '../src/modules/benchmark/benchmark.service';
import { ComputeTier, HardwareVerificationStatus } from '@distributed-compute/shared-types';

describe('BenchmarkController Unit Tests', () => {
  let controller: BenchmarkController;
  let mockBenchmarkService: Partial<BenchmarkService>;

  beforeEach(() => {
    mockBenchmarkService = {
      submitAndVerifyBenchmark: vi.fn().mockResolvedValue({
        nodeId: 'node-101',
        status: HardwareVerificationStatus.VERIFIED,
        verifiedScore: 880,
        computeTier: ComputeTier.TIER_1_ENTERPRISE_GPU,
        confidenceScorePercent: 99.8,
        reason: 'Hardware verified',
        timestamp: new Date().toISOString(),
      }),
      getComputeTiers: vi.fn().mockReturnValue([
        {
          tier: ComputeTier.TIER_1_ENTERPRISE_GPU,
          name: 'Tier 1',
          description: 'Enterprise GPUs',
          minScore: 850,
          sampleGpuModels: ['H100'],
          suggestedHourlyRangeUsd: [2.5, 4.8],
        },
      ]),
      getNodeBenchmark: vi.fn().mockResolvedValue({
        nodeId: 'node-101',
        status: HardwareVerificationStatus.VERIFIED,
        verifiedScore: 880,
        computeTier: ComputeTier.TIER_1_ENTERPRISE_GPU,
        confidenceScorePercent: 99.8,
        reason: 'Hardware verified',
        timestamp: new Date().toISOString(),
      }),
    };

    controller = new BenchmarkController(mockBenchmarkService as BenchmarkService);
  });

  it('should delegate submitBenchmark call', async () => {
    const dto = {
      nodeId: 'node-101',
      metrics: {
        version: '1.0',
        cpuGflops: 12,
        gpuTflops: 60,
        memoryBandwidthGbps: 16,
        diskIops: 2000,
        challengeDurationMs: 50,
        compositeScore: 880,
        computeTier: ComputeTier.TIER_1_ENTERPRISE_GPU,
      },
      proofOfWorkSignature: 'signature1234567890',
    };
    const res = await controller.submitBenchmark(dto);
    expect(res.status).toBe(HardwareVerificationStatus.VERIFIED);
    expect(mockBenchmarkService.submitAndVerifyBenchmark).toHaveBeenCalledWith(dto);
  });

  it('should delegate getTiers call', () => {
    const tiers = controller.getTiers();
    expect(tiers.length).toBe(1);
    expect(mockBenchmarkService.getComputeTiers).toHaveBeenCalled();
  });

  it('should delegate getNodeBenchmark call', async () => {
    const res = await controller.getNodeBenchmark('node-101');
    expect(res.nodeId).toBe('node-101');
    expect(mockBenchmarkService.getNodeBenchmark).toHaveBeenCalledWith('node-101');
  });
});
