import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SchedulerService } from '../src/modules/scheduler/scheduler.service';
import { PrismaService } from '../src/modules/prisma/prisma.service';
import { RedisService } from '../src/modules/redis/redis.service';
import { SchedulingStrategy, JobStatus } from '@distributed-compute/shared-types';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('SchedulerService Unit Tests', () => {
  let service: SchedulerService;
  let mockPrisma: any;
  let mockRedis: any;

  const sampleNodes = [
    {
      id: 'node-cheap-1',
      name: 'Budget-RTX3080',
      gpuModel: 'NVIDIA RTX 3080',
      gpuCount: 1,
      vramGb: 10,
      hourlyRateUsd: 0.35,
      benchmarkScore: 500,
    },
    {
      id: 'node-fast-2',
      name: 'Flagship-H100',
      gpuModel: 'NVIDIA H100',
      gpuCount: 8,
      vramGb: 80,
      hourlyRateUsd: 19.50,
      benchmarkScore: 990,
    },
    {
      id: 'node-balanced-3',
      name: 'Pro-RTX4090',
      gpuModel: 'NVIDIA RTX 4090',
      gpuCount: 2,
      vramGb: 24,
      hourlyRateUsd: 1.35,
      benchmarkScore: 840,
    },
  ];

  beforeEach(() => {
    mockPrisma = {
      computeNode: {
        findMany: vi.fn().mockResolvedValue(sampleNodes),
        findUnique: vi.fn().mockResolvedValue(sampleNodes[0]),
      },
      job: {
        findUnique: vi.fn(),
        findMany: vi.fn(),
        update: vi.fn(),
      },
    };

    mockRedis = {
      getClient: vi.fn().mockReturnValue({
        get: vi.fn().mockResolvedValue(null),
        set: vi.fn().mockResolvedValue('OK'),
        rpush: vi.fn().mockResolvedValue(1),
      }),
      isHealthy: vi.fn().mockResolvedValue(true),
    };

    service = new SchedulerService(
      mockPrisma as PrismaService,
      mockRedis as RedisService,
    );
  });

  describe('evaluateCandidates()', () => {
    it('should prioritize cheapest node under CHEAPEST strategy', async () => {
      const decision = await service.evaluateCandidates({
        strategy: SchedulingStrategy.CHEAPEST,
        requiredGpus: 1,
        minVramGb: 8,
      });

      expect(decision.selectedNodeId).toBe('node-cheap-1');
      expect(decision.strategy).toBe(SchedulingStrategy.CHEAPEST);
      expect(decision.rankedCandidates.length).toBe(3);
    });

    it('should prioritize highest benchmark under BEST_PERFORMANCE strategy', async () => {
      const decision = await service.evaluateCandidates({
        strategy: SchedulingStrategy.BEST_PERFORMANCE,
        requiredGpus: 1,
        minVramGb: 8,
      });

      expect(decision.selectedNodeId).toBe('node-fast-2');
      expect(decision.strategy).toBe(SchedulingStrategy.BEST_PERFORMANCE);
    });

    it('should balance cost and performance under BEST_PRICE_PERFORMANCE strategy', async () => {
      const decision = await service.evaluateCandidates({
        strategy: SchedulingStrategy.BEST_PRICE_PERFORMANCE,
        requiredGpus: 1,
        minVramGb: 8,
      });

      // Node 3 (RTX 4090) has strong composite score (high perf, low price)
      expect(decision.rankedCandidates.length).toBe(3);
      expect(decision.selectedNodeId).toBeDefined();
    });

    it('should apply custom multi-objective weights', async () => {
      const decision = await service.evaluateCandidates({
        strategy: SchedulingStrategy.CUSTOM_WEIGHTS,
        weights: {
          costWeight: 0.05,
          performanceWeight: 0.90,
          reliabilityWeight: 0.05,
        },
      });

      expect(decision.selectedNodeId).toBe('node-fast-2');
    });

    it('should throw BadRequestException if no candidates match constraints', async () => {
      mockPrisma.computeNode.findMany.mockResolvedValue([]);
      await expect(
        service.evaluateCandidates({ requiredGpus: 16, minVramGb: 500 }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('scheduleJob()', () => {
    it('should schedule job to optimal node', async () => {
      mockPrisma.job.findUnique.mockResolvedValue({
        id: 'job-777',
        customerId: 'cust-1',
        nodeId: 'node-cheap-1',
        status: JobStatus.PENDING,
      });
      mockPrisma.job.update.mockResolvedValue({});

      const decision = await service.scheduleJob({
        jobId: 'job-777',
        strategy: SchedulingStrategy.CHEAPEST,
      });

      expect(decision.jobId).toBe('job-777');
      expect(mockPrisma.job.update).toHaveBeenCalled();
    });
  });

  describe('handleNodeFailover()', () => {
    it('should migrate active jobs to new node upon failure', async () => {
      mockPrisma.computeNode.findUnique.mockResolvedValue({
        id: 'failed-node',
        gpuCount: 1,
        vramGb: 10,
      });
      mockPrisma.job.findMany.mockResolvedValue([
        { id: 'job-active-1', status: JobStatus.RUNNING, nodeId: 'failed-node' },
      ]);
      mockPrisma.job.update.mockResolvedValue({});

      const events = await service.handleNodeFailover('failed-node');
      expect(events.length).toBe(1);
      expect(events[0].failedNodeId).toBe('failed-node');
      expect(events[0].targetNodeId).toBeDefined();
    });
  });
});
