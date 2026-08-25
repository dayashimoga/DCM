import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BillingController } from '../src/modules/billing/billing.controller';
import { BillingService } from '../src/modules/billing/billing.service';

describe('BillingController Unit Tests', () => {
  let controller: BillingController;
  let mockService: Partial<BillingService>;

  beforeEach(() => {
    mockService = {
      recordUsageTick: vi.fn().mockResolvedValue({
        userId: 'user-1',
        jobId: 'job-1',
        amountDeductedUsd: 0.05,
        remainingBalanceUsd: 49.95,
        status: 'SUCCESS',
        timestamp: new Date().toISOString(),
      }),
      getCustomerUsage: vi.fn().mockResolvedValue({
        customerId: 'user-1',
        totalGpuSeconds: 3600,
        totalCostUsd: 2.50,
        currentBurnRateUsdPerHour: 1.25,
        activeJobsCount: 1,
        records: [],
      }),
      getProviderEarnings: vi.fn().mockResolvedValue({
        providerId: 'prov-1',
        totalGrossEarningsUsd: 100.0,
        totalPlatformFeesUsd: 15.0,
        totalNetEarningsUsd: 85.0,
        pendingPayoutUsd: 85.0,
        totalComputeSecondsServed: 72000,
      }),
      generateInvoice: vi.fn().mockResolvedValue({
        id: 'inv-1',
        invoiceNumber: 'INV-2026-1001',
        userId: 'user-1',
        periodStart: new Date().toISOString(),
        periodEnd: new Date().toISOString(),
        subtotalUsd: 2.50,
        platformFeeUsd: 0.38,
        totalUsd: 2.50,
        status: 'PAID',
        lineItems: [],
        createdAt: new Date().toISOString(),
      }),
      addMockCredits: vi.fn().mockResolvedValue({ balanceUsd: 100.0 }),
    };

    controller = new BillingController(mockService as BillingService);
  });

  it('should delegate recordUsageTick call', async () => {
    const dto = { jobId: 'job-1', nodeId: 'node-1', durationSeconds: 15 };
    const res = await controller.recordUsageTick(dto);
    expect(res.amountDeductedUsd).toBe(0.05);
  });

  it('should delegate getCustomerUsage call', async () => {
    const res = await controller.getCustomerUsage('user-1');
    expect(res.totalCostUsd).toBe(2.50);
  });

  it('should delegate getProviderEarnings call', async () => {
    const res = await controller.getProviderEarnings('prov-1');
    expect(res.totalNetEarningsUsd).toBe(85.0);
  });

  it('should delegate generateInvoice call', async () => {
    const res = await controller.generateInvoice('user-1', { periodDays: 30 });
    expect(res.invoiceNumber).toBe('INV-2026-1001');
  });

  it('should delegate addCredits call', async () => {
    const res = await controller.addCredits('user-1', 50.0);
    expect(res.balanceUsd).toBe(100.0);
  });
});
