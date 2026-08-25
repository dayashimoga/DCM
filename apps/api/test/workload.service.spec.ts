import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WorkloadService } from '../src/modules/workload/workload.service';
import { PrismaService } from '../src/modules/prisma/prisma.service';
import { RedisService } from '../src/modules/redis/redis.service';
import { JobStatus } from '@distributed-compute/shared-types';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('WorkloadService Unit Tests', () => {
  let service: WorkloadService;
  let mockPrisma: any;
  let mockRedis: any;

  beforeEach(() => {
    mockPrisma = {
      user: {
        findUnique: vi.fn(),
      },
      computeNode: {
        findUnique: vi.fn(),
        findMany: vi.fn(),
      },
      job: {
        create: vi.fn(),
        findMany: vi.fn(),
        findUnique: vi.fn(),
        findFirst: vi.fn(),
        update: vi.fn(),
      },
    };

    mockRedis = {
      getClient: vi.fn().mockReturnValue({
        set: vi.fn().mockResolvedValue('OK'),
        get: vi.fn().mockResolvedValue(null),
        del: vi.fn().mockResolvedValue(1),
        rpush: vi.fn().mockResolvedValue(1),
        lrange: vi.fn().mockResolvedValue(['Log 1', 'Log 2']),
      }),
      isHealthy: vi.fn().mockResolvedValue(true),
    };

    service = new WorkloadService(
      mockPrisma as PrismaService,
      mockRedis as RedisService,
    );
  });

  describe('createJob()', () => {
    it('should create and schedule a job on target node', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'user-1' });
      mockPrisma.computeNode.findUnique.mockResolvedValue({
        id: 'node-101',
        hourlyRateUsd: 2.5,
        gpuCount: 1,
      });
      mockPrisma.job.create.mockResolvedValue({
        id: 'job-999',
        customerId: 'user-1',
        nodeId: 'node-101',
        image: 'nvidia/cuda:12.2.0-base-ubuntu22.04',
        command: 'nvidia-smi',
        status: JobStatus.SCHEDULED,
        startedAt: null,
        completedAt: null,
        totalGpuSeconds: 0,
        totalCostUsd: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const res = await service.createJob('user-1', {
        image: 'nvidia/cuda:12.2.0-base-ubuntu22.04',
        command: 'nvidia-smi',
        nodeId: 'node-101',
      });

      expect(res.id).toBe('job-999');
      expect(res.status).toBe(JobStatus.SCHEDULED);
      expect(mockPrisma.job.create).toHaveBeenCalled();
    });

    it('should throw NotFoundException if user does not exist', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      await expect(
        service.createJob('unknown-user', { image: 'alpine:latest' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if no candidate nodes match hardware', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'user-1' });
      mockPrisma.computeNode.findMany.mockResolvedValue([]);
      await expect(
        service.createJob('user-1', { image: 'alpine:latest', gpuCount: 8, minVramGb: 80 }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('handleAgentStatusUpdate()', () => {
    it('should handle transition to RUNNING and COMPLETED', async () => {
      const started = new Date(Date.now() - 60000);
      mockPrisma.job.findUnique.mockResolvedValue({
        id: 'job-999',
        customerId: 'user-1',
        nodeId: 'node-101',
        status: JobStatus.RUNNING,
        startedAt: started,
        createdAt: started,
        node: {
          gpuCount: 1,
          hourlyRateUsd: 3.60,
        },
      });
      mockPrisma.job.update.mockResolvedValue({});

      const res = await service.handleAgentStatusUpdate({
        jobId: 'job-999',
        nodeId: 'node-101',
        status: JobStatus.COMPLETED,
        exitCode: 0,
        logs: ['Epoch 1/1 complete', 'Training loss 0.021'],
      });

      expect(res.acknowledged).toBe(true);
      expect(mockPrisma.job.update).toHaveBeenCalled();
    });
  });

  describe('cancelJob()', () => {
    it('should cancel active job', async () => {
      mockPrisma.job.findUnique.mockResolvedValue({
        id: 'job-999',
        customerId: 'user-1',
        nodeId: 'node-101',
        status: JobStatus.SCHEDULED,
        image: 'alpine',
        totalGpuSeconds: 0,
        totalCostUsd: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      mockPrisma.job.update.mockResolvedValue({
        id: 'job-999',
        customerId: 'user-1',
        nodeId: 'node-101',
        status: JobStatus.CANCELLED,
        image: 'alpine',
        totalGpuSeconds: 0,
        totalCostUsd: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const res = await service.cancelJob('job-999', 'user-1');
      expect(res.status).toBe(JobStatus.CANCELLED);
    });
  });
});
