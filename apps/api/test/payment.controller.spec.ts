import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PaymentController } from '../src/modules/payment/payment.controller';
import { PaymentService } from '../src/modules/payment/payment.service';
import { PaymentMethod, TransactionType, EscrowStatus } from '@distributed-compute/shared-types';

describe('PaymentController Unit Tests', () => {
  let controller: PaymentController;
  let mockService: Partial<PaymentService>;

  beforeEach(() => {
    mockService = {
      getWalletSummary: vi.fn().mockResolvedValue({
        userId: 'user-1',
        availableBalanceUsd: 150.0,
        lockedInEscrowUsd: 25.0,
        totalDepositedUsd: 175.0,
        cryptoAddresses: [],
        recentTransactions: [],
        activeEscrows: [],
      }),
      processDeposit: vi.fn().mockResolvedValue({
        id: 'tx-101',
        userId: 'user-1',
        type: TransactionType.DEPOSIT,
        amountUsd: 50.0,
        currency: 'USD',
        status: 'CONFIRMED',
        createdAt: new Date().toISOString(),
      }),
      lockEscrow: vi.fn().mockResolvedValue({
        id: 'escrow-101',
        jobId: 'job-1',
        customerId: 'user-1',
        providerId: 'prov-1',
        amountLockedUsd: 25.0,
        amountSettledUsd: 0,
        amountRefundedUsd: 0,
        status: EscrowStatus.HELD,
        createdAt: new Date().toISOString(),
      }),
      settleEscrow: vi.fn().mockResolvedValue({
        id: 'escrow-101',
        jobId: 'job-1',
        customerId: 'user-1',
        providerId: 'prov-1',
        amountLockedUsd: 25.0,
        amountSettledUsd: 15.0,
        amountRefundedUsd: 10.0,
        status: EscrowStatus.SETTLED,
        createdAt: new Date().toISOString(),
      }),
      refundEscrow: vi.fn().mockResolvedValue({
        id: 'escrow-101',
        jobId: 'job-1',
        customerId: 'user-1',
        providerId: 'prov-1',
        amountLockedUsd: 25.0,
        amountSettledUsd: 0,
        amountRefundedUsd: 25.0,
        status: EscrowStatus.REFUNDED,
        createdAt: new Date().toISOString(),
      }),
    };

    controller = new PaymentController(mockService as PaymentService);
  });

  it('should delegate getWalletSummary call', async () => {
    const res = await controller.getWalletSummary('user-1');
    expect(res.availableBalanceUsd).toBe(150.0);
  });

  it('should delegate processDeposit call', async () => {
    const dto = { userId: 'user-1', amountUsd: 50.0, method: PaymentMethod.FIAT_STRIPE };
    const res = await controller.processDeposit(dto);
    expect(res.type).toBe(TransactionType.DEPOSIT);
  });

  it('should delegate lockEscrow call', async () => {
    const dto = { jobId: 'job-1', customerId: 'user-1', providerId: 'prov-1', estimatedBudgetUsd: 25.0 };
    const res = await controller.lockEscrow(dto);
    expect(res.status).toBe(EscrowStatus.HELD);
  });

  it('should delegate settleEscrow call', async () => {
    const dto = { jobId: 'job-1', actualCostUsd: 15.0 };
    const res = await controller.settleEscrow(dto);
    expect(res.status).toBe(EscrowStatus.SETTLED);
  });

  it('should delegate refundEscrow call', async () => {
    const res = await controller.refundEscrow('job-1', 'Cancelled');
    expect(res.status).toBe(EscrowStatus.REFUNDED);
  });
});
