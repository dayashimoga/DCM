import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PayoutController } from '../src/modules/payout/payout.controller';
import { PayoutService } from '../src/modules/payout/payout.service';
import { PayoutDestinationType, PayoutStatus } from '@distributed-compute/shared-types';

describe('PayoutController Unit Tests', () => {
  let controller: PayoutController;
  let mockService: Partial<PayoutService>;

  beforeEach(() => {
    mockService = {
      getEarningsAnalytics: vi.fn().mockResolvedValue({
        providerId: 'prov-1',
        grossRevenueUsd: 200.0,
        platformFeeUsd: 30.0,
        netEarnedUsd: 170.0,
        availablePayoutBalanceUsd: 120.0,
        totalPaidOutUsd: 50.0,
        activeGpuCount: 4,
        averageUtilizationPercent: 80.0,
        estimatedMonthlyYieldUsd: 2900.0,
        payoutHistory: [],
        destinations: [],
      }),
      requestPayout: vi.fn().mockResolvedValue({
        id: 'po-101',
        providerId: 'prov-1',
        amountUsd: 100.0,
        feeUsd: 1.50,
        netAmountUsd: 98.50,
        destinationType: PayoutDestinationType.BANK_STRIPE_CONNECT,
        destinationTarget: '•••• 4242',
        status: PayoutStatus.COMPLETED,
        requestedAt: new Date().toISOString(),
      }),
      addDestination: vi.fn().mockResolvedValue({
        id: 'dest-101',
        providerId: 'prov-1',
        type: PayoutDestinationType.CRYPTO_SOL,
        label: 'Solana Cold Storage',
        target: 'So11111111111111111111111111111111111111112844e',
        isDefault: true,
        verified: true,
        createdAt: new Date().toISOString(),
      }),
    };

    controller = new PayoutController(mockService as PayoutService);
  });

  it('should delegate getEarningsAnalytics call', async () => {
    const res = await controller.getEarningsAnalytics('prov-1');
    expect(res.availablePayoutBalanceUsd).toBe(120.0);
    expect(res.estimatedMonthlyYieldUsd).toBe(2900.0);
  });

  it('should delegate requestPayout call', async () => {
    const dto = {
      providerId: 'prov-1',
      amountUsd: 100.0,
      destinationType: PayoutDestinationType.BANK_STRIPE_CONNECT,
    };
    const res = await controller.requestPayout(dto);
    expect(res.amountUsd).toBe(100.0);
    expect(res.status).toBe(PayoutStatus.COMPLETED);
  });

  it('should delegate addDestination call', async () => {
    const dto = {
      providerId: 'prov-1',
      type: PayoutDestinationType.CRYPTO_SOL,
      label: 'Solana Cold Storage',
      target: 'So11111111111111111111111111111111111111112844e',
    };
    const res = await controller.addDestination(dto);
    expect(res.label).toBe('Solana Cold Storage');
  });
});
