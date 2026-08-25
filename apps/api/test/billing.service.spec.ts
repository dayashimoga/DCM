import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BillingService } from '../src/modules/billing/billing.service';
import { PrismaService } from '../src/modules/prisma/prisma.service';
import { RedisService } from '../src/modules/redis/redis.service';
import { JobStatus } from '@distributed-compute/shared-types';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('BillingService Unit Tests', () => {
  let service: BillingService;
  let mockPrisma: any;
  let mockRedis: any;

  const sampleCustomer = {
    id: 'cust-123',
    email: 'client@example.com',
    balanceUsd: 10.0,
  };

  const sampleJob = {
    id: 'job-101',
    customerId: 'cust-123',
    totalGpuSeconds: 60,
    totalCostUsd: 0.10,
    node: {
      id: 'node-h100',
      name: 'NVIDIA-H100-Rig',
      providerId: 'prov-456',
      hourlyRateUsd: 6.0,
    },
    customer: sampleCustomer,
  };

  beforeEach(() => {
    mockPrisma = {
      job: {
        findUnique: vi.fn().mockResolvedValue(sampleJob),
        findMany: vi.fn().mockResolvedValue([
          {
            id: 'job-101',
            customerId: 'cust-123',
            totalGpuSeconds: 120,
            totalCostUsd: 0.20,
            status: JobStatus.RUNNING,
            updatedAt: new Date(),
            node: { id: 'node-h100', providerId: 'prov-456', hourlyRateUsd: 6.0 },
          },
        ]),
        update: vi.fn().mockResolvedValue({}),
      },
      user: {
        findUnique: vi.fn().mockResolvedValue(sampleCustomer),
        update: vi.fn().mockResolvedValue({ ...sampleCustomer, balanceUsd: 9.975 }),
      },
      computeNode: {
        findMany: vi.fn().mockResolvedValue([
          {
            id: 'node-h100',
            providerId: 'prov-456',
            jobs: [
              { totalCostUsd: 10.0, totalGpuSeconds: 6000 },
            ],
          },
        ]),
      },
    };

    mockRedis = {
      getClient: vi.fn().mockReturnValue({
        lpush: vi.fn().mockResolvedValue(1),
        rpush: vi.fn().mockResolvedValue(1),
      }),
      isHealthy: vi.fn().mockResolvedValue(true),
    };

    service = new BillingService(
      mockPrisma as PrismaService,
      mockRedis as RedisService,
    );
  });

  describe('recordUsageTick()', () => {
    it('should calculate cost accurately and deduct balance', async () => {
      // 15 seconds at $6.00/hr = (6/3600)*15 = $0.025
      const event = await service.recordUsageTick({
        jobId: 'job-101',
        nodeId: 'node-h100',
        durationSeconds: 15,
      });

      expect(event.amountDeductedUsd).toBe(0.025);
      expect(event.status).toBe('SUCCESS');
      expect(mockPrisma.user.update).toHaveBeenCalled();
      expect(mockPrisma.job.update).toHaveBeenCalled();
    });

    it('should trigger DEPLETED balance protection when funds reach zero', async () => {
      mockPrisma.user.update.mockResolvedValue({ ...sampleCustomer, balanceUsd: 0.0 });
      mockPrisma.job.findUnique.mockResolvedValue({
        ...sampleJob,
        customer: { ...sampleCustomer, balanceUsd: 0.01 },
      });

      const event = await service.recordUsageTick({
        jobId: 'job-101',
        nodeId: 'node-h100',
        durationSeconds: 60, // cost: $0.10 > balance
      });

      expect(event.status).toBe('DEPLETED');
      expect(mockPrisma.job.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { status: JobStatus.CANCELLED },
        }),
      );
    });

    it('should throw NotFoundException if job not found', async () => {
      mockPrisma.job.findUnique.mockResolvedValue(null);
      await expect(
        service.recordUsageTick({ jobId: 'unknown', nodeId: 'node-1', durationSeconds: 10 }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getCustomerUsage()', () => {
    it('should return aggregated usage metrics and active burn rate', async () => {
      const usage = await service.getCustomerUsage('cust-123');
      expect(usage.totalCostUsd).toBe(0.2);
      expect(usage.totalGpuSeconds).toBe(120);
      expect(usage.currentBurnRateUsdPerHour).toBe(6.0);
      expect(usage.activeJobsCount).toBe(1);
    });
  });

  describe('getProviderEarnings()', () => {
    it('should calculate 85% net earnings and 15% platform commission', async () => {
      const earnings = await service.getProviderEarnings('prov-456');
      expect(earnings.totalGrossEarningsUsd).toBe(10.0);
      expect(earnings.totalPlatformFeesUsd).toBe(1.5);
      expect(earnings.totalNetEarningsUsd).toBe(8.5);
    });
  });

  describe('generateInvoice()', () => {
    it('should generate an itemized invoice statement', async () => {
      const invoice = await service.generateInvoice('cust-123');
      expect(invoice.invoiceNumber).toContain('INV-2026-');
      expect(invoice.status).toBe('PAID');
      expect(invoice.lineItems.length).toBeGreaterThan(0);
    });
  });

  describe('addMockCredits()', () => {
    it('should add funds to user balance', async () => {
      mockPrisma.user.update.mockResolvedValue({ ...sampleCustomer, balanceUsd: 60.0 });
      const res = await service.addMockCredits('cust-123', 50.0);
      expect(res.balanceUsd).toBe(60.0);
    });

    it('should throw BadRequestException on negative credits', async () => {
      await expect(service.addMockCredits('cust-123', -10)).rejects.toThrow(BadRequestException);
    });
  });
});
