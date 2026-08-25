import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BenchmarkService } from '../src/modules/benchmark/benchmark.service';
import { PrismaService } from '../src/modules/prisma/prisma.service';
import { RedisService } from '../src/modules/redis/redis.service';
import { ComputeTier, HardwareVerificationStatus } from '@distributed-compute/shared-types';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('BenchmarkService Unit Tests', () => {
  let service: BenchmarkService;
  let mockPrisma: any;
  let mockRedis: any;

  beforeEach(() => {
    mockPrisma = {
      computeNode: {
        findUnique: vi.fn(),
        update: vi.fn(),
      },
    };

    mockRedis = {
      getClient: vi.fn().mockReturnValue(null),
      isHealthy: vi.fn().mockResolvedValue(false),
    };

    service = new BenchmarkService(
      mockPrisma as PrismaService,
      mockRedis as RedisService,
    );
  });

  describe('submitAndVerifyBenchmark()', () => {
    it('should verify genuine Tier 1 H100 benchmark submission', async () => {
      mockPrisma.computeNode.findUnique.mockResolvedValue({
        id: 'node-h100',
        gpuModel: 'NVIDIA H100 80GB HBM3',
        vramGb: 80,
      });
      mockPrisma.computeNode.update.mockResolvedValue({});

      const result = await service.submitAndVerifyBenchmark({
        nodeId: 'node-h100',
        metrics: {
          version: '1.0',
          cpuGflops: 15.2,
          gpuTflops: 67.0,
          memoryBandwidthGbps: 18.5,
          diskIops: 2500,
          challengeDurationMs: 42.1,
          compositeScore: 980,
          computeTier: ComputeTier.TIER_1_ENTERPRISE_GPU,
        },
        proofOfWorkSignature: 'abcdef0123456789abcdef0123456789',
      });

      expect(result.status).toBe(HardwareVerificationStatus.VERIFIED);
      expect(result.verifiedScore).toBe(980);
      expect(result.computeTier).toBe(ComputeTier.TIER_1_ENTERPRISE_GPU);
      expect(result.confidenceScorePercent).toBeGreaterThan(90);
    });

    it('should flag as SUSPICIOUS if claimed H100 but score is poor', async () => {
      mockPrisma.computeNode.findUnique.mockResolvedValue({
        id: 'node-fake-h100',
        gpuModel: 'NVIDIA H100 80GB HBM3',
        vramGb: 80,
      });

      const result = await service.submitAndVerifyBenchmark({
        nodeId: 'node-fake-h100',
        metrics: {
          version: '1.0',
          cpuGflops: 2.1,
          gpuTflops: 4.0,
          memoryBandwidthGbps: 3.2,
          diskIops: 200,
          challengeDurationMs: 800.0,
          compositeScore: 250,
          computeTier: ComputeTier.TIER_1_ENTERPRISE_GPU,
        },
        proofOfWorkSignature: 'abcdef0123456789abcdef0123456789',
      });

      expect(result.status).toBe(HardwareVerificationStatus.SUSPICIOUS);
      expect(result.confidenceScorePercent).toBeLessThan(50);
    });

    it('should throw BadRequestException if signature is invalid or short', async () => {
      mockPrisma.computeNode.findUnique.mockResolvedValue({ id: 'node-1' });

      await expect(
        service.submitAndVerifyBenchmark({
          nodeId: 'node-1',
          metrics: {
            version: '1.0',
            cpuGflops: 10,
            gpuTflops: 20,
            memoryBandwidthGbps: 10,
            diskIops: 500,
            challengeDurationMs: 100,
            compositeScore: 600,
            computeTier: ComputeTier.TIER_2_PRO_GPU,
          },
          proofOfWorkSignature: 'short',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException if node does not exist', async () => {
      mockPrisma.computeNode.findUnique.mockResolvedValue(null);

      await expect(
        service.submitAndVerifyBenchmark({
          nodeId: 'unknown-node',
          metrics: {
            version: '1.0',
            cpuGflops: 10,
            gpuTflops: 20,
            memoryBandwidthGbps: 10,
            diskIops: 500,
            challengeDurationMs: 100,
            compositeScore: 600,
            computeTier: ComputeTier.TIER_2_PRO_GPU,
          },
          proofOfWorkSignature: 'abcdef0123456789abcdef0123456789',
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getComputeTiers()', () => {
    it('should return 4 standardized tiers', () => {
      const tiers = service.getComputeTiers();
      expect(tiers.length).toBe(4);
      expect(tiers[0].tier).toBe(ComputeTier.TIER_1_ENTERPRISE_GPU);
      expect(tiers[3].tier).toBe(ComputeTier.TIER_4_CPU_ONLY);
    });
  });
});
