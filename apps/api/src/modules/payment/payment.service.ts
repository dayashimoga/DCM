import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { DepositDto } from './dto/deposit.dto';
import { LockEscrowDto } from './dto/lock-escrow.dto';
import { SettleEscrowDto } from './dto/settle-escrow.dto';
import {
  WalletSummary,
  WalletTransaction,
  EscrowHold,
  EscrowStatus,
  TransactionType,
  PaymentMethod,
  CryptoDepositAddress,
} from '@distributed-compute/shared-types';

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  private generateDeterministicAddresses(userId: string): CryptoDepositAddress[] {
    const hash = userId.split('-')[0] || '123';
    return [
      {
        symbol: 'USDC',
        network: 'Solana (SPL)',
        address: `EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyT${hash}`,
        minDepositUsd: 5.0,
      },
      {
        symbol: 'USDT',
        network: 'Ethereum (ERC-20)',
        address: `0xdAC17F958D2ee523a2206206994597C13D831ec7${hash}`,
        minDepositUsd: 10.0,
      },
      {
        symbol: 'SOL',
        network: 'Solana Mainnet',
        address: `So11111111111111111111111111111111111111112${hash}`,
        minDepositUsd: 5.0,
      },
      {
        symbol: 'ETH',
        network: 'Ethereum Mainnet',
        address: `0x742d35Cc6634C0532925a3b844Bc454e4438f44e${hash}`,
        minDepositUsd: 20.0,
      },
    ];
  }

  async getWalletSummary(userId: string): Promise<WalletSummary> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException(`User ${userId} not found`);
    }

    const redisClient = this.redis.getClient();
    const redisHealthy = await this.redis.isHealthy();

    const recentTransactions: WalletTransaction[] = [];
    const activeEscrows: EscrowHold[] = [];
    let lockedInEscrowUsd = 0;

    if (redisClient && redisHealthy) {
      const rawTxs = await redisClient.lrange(`wallet:txs:${userId}`, 0, 20);
      rawTxs.forEach((raw) => {
        try {
          recentTransactions.push(JSON.parse(raw));
        } catch {}
      });

      const escrowKeys = await redisClient.keys(`escrow:user:${userId}:*`);
      for (const k of escrowKeys) {
        const raw = await redisClient.get(k);
        if (raw) {
          try {
            const hold: EscrowHold = JSON.parse(raw);
            if (hold.status === EscrowStatus.HELD) {
              activeEscrows.push(hold);
              lockedInEscrowUsd += hold.amountLockedUsd;
            }
          } catch {}
        }
      }
    }

    return {
      userId,
      availableBalanceUsd: Number(user.balanceUsd),
      lockedInEscrowUsd: parseFloat(lockedInEscrowUsd.toFixed(4)),
      totalDepositedUsd: parseFloat((Number(user.balanceUsd) + lockedInEscrowUsd).toFixed(2)),
      cryptoAddresses: this.generateDeterministicAddresses(userId),
      recentTransactions,
      activeEscrows,
    };
  }

  async processDeposit(dto: DepositDto): Promise<WalletTransaction> {
    const user = await this.prisma.user.findUnique({
      where: { id: dto.userId },
    });

    if (!user) {
      throw new NotFoundException(`User ${dto.userId} not found`);
    }

    await this.prisma.user.update({
      where: { id: dto.userId },
      data: { balanceUsd: { increment: dto.amountUsd } },
    });

    const tx: WalletTransaction = {
      id: `tx-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      userId: dto.userId,
      type: TransactionType.DEPOSIT,
      amountUsd: dto.amountUsd,
      currency: 'USD',
      method: dto.method || PaymentMethod.FIAT_STRIPE,
      referenceId: dto.txHash || `stripe_ch_${Date.now()}`,
      description: `Account Deposit via ${dto.method || PaymentMethod.FIAT_STRIPE}`,
      status: 'CONFIRMED',
      createdAt: new Date().toISOString(),
    };

    const redisClient = this.redis.getClient();
    const redisHealthy = await this.redis.isHealthy();
    if (redisClient && redisHealthy) {
      await redisClient.lpush(`wallet:txs:${dto.userId}`, JSON.stringify(tx));
    }

    this.logger.log(`Processed deposit of $${dto.amountUsd} for user ${dto.userId}`);
    return tx;
  }

  async lockEscrow(dto: LockEscrowDto): Promise<EscrowHold> {
    const user = await this.prisma.user.findUnique({
      where: { id: dto.customerId },
    });

    if (!user) {
      throw new NotFoundException(`Customer ${dto.customerId} not found`);
    }

    if (Number(user.balanceUsd) < dto.estimatedBudgetUsd) {
      throw new BadRequestException(
        `Insufficient available balance ($${Number(user.balanceUsd).toFixed(2)}) to lock escrow budget ($${dto.estimatedBudgetUsd.toFixed(2)})`,
      );
    }

    // Deduct available balance
    await this.prisma.user.update({
      where: { id: dto.customerId },
      data: { balanceUsd: { decrement: dto.estimatedBudgetUsd } },
    });

    const escrow: EscrowHold = {
      id: `escrow-${dto.jobId}`,
      jobId: dto.jobId,
      customerId: dto.customerId,
      providerId: dto.providerId,
      amountLockedUsd: dto.estimatedBudgetUsd,
      amountSettledUsd: 0,
      amountRefundedUsd: 0,
      status: EscrowStatus.HELD,
      createdAt: new Date().toISOString(),
    };

    const lockTx: WalletTransaction = {
      id: `tx-lock-${dto.jobId}`,
      userId: dto.customerId,
      type: TransactionType.ESCROW_LOCK,
      amountUsd: dto.estimatedBudgetUsd,
      currency: 'USD',
      referenceId: dto.jobId,
      description: `Escrow Hold Locked for Job ${dto.jobId.substring(0, 8)}`,
      status: 'CONFIRMED',
      createdAt: new Date().toISOString(),
    };

    const redisClient = this.redis.getClient();
    const redisHealthy = await this.redis.isHealthy();
    if (redisClient && redisHealthy) {
      await redisClient.set(`escrow:job:${dto.jobId}`, JSON.stringify(escrow));
      await redisClient.set(`escrow:user:${dto.customerId}:${dto.jobId}`, JSON.stringify(escrow));
      await redisClient.lpush(`wallet:txs:${dto.customerId}`, JSON.stringify(lockTx));
    }

    this.logger.log(`Locked $${dto.estimatedBudgetUsd} in escrow for job ${dto.jobId}`);
    return escrow;
  }

  async settleEscrow(dto: SettleEscrowDto): Promise<EscrowHold> {
    const redisClient = this.redis.getClient();
    const redisHealthy = await this.redis.isHealthy();

    let escrow: EscrowHold | null = null;
    if (redisClient && redisHealthy) {
      const raw = await redisClient.get(`escrow:job:${dto.jobId}`);
      if (raw) {
        try {
          escrow = JSON.parse(raw);
        } catch {}
      }
    }

    if (!escrow) {
      // Create fallback escrow record
      escrow = {
        id: `escrow-${dto.jobId}`,
        jobId: dto.jobId,
        customerId: 'demo-customer',
        providerId: 'demo-provider',
        amountLockedUsd: dto.actualCostUsd,
        amountSettledUsd: 0,
        amountRefundedUsd: 0,
        status: EscrowStatus.HELD,
        createdAt: new Date().toISOString(),
      };
    }

    const actualCost = dto.actualCostUsd;
    const amountRefunded = Math.max(0, parseFloat((escrow.amountLockedUsd - actualCost).toFixed(4)));

    // Refund unused escrow buffer back to customer wallet
    if (amountRefunded > 0) {
      await this.prisma.user.update({
        where: { id: escrow.customerId },
        data: { balanceUsd: { increment: amountRefunded } },
      });

      const refundTx: WalletTransaction = {
        id: `tx-ref-${dto.jobId}`,
        userId: escrow.customerId,
        type: TransactionType.ESCROW_REFUND,
        amountUsd: amountRefunded,
        currency: 'USD',
        referenceId: dto.jobId,
        description: `Unused Escrow Refund for Job ${dto.jobId.substring(0, 8)}`,
        status: 'CONFIRMED',
        createdAt: new Date().toISOString(),
      };

      if (redisClient && redisHealthy) {
        await redisClient.lpush(`wallet:txs:${escrow.customerId}`, JSON.stringify(refundTx));
      }
    }

    // Settle provider earnings (85%)
    const providerEarnings = parseFloat((actualCost * 0.85).toFixed(4));
    await this.prisma.user.update({
      where: { id: escrow.providerId },
      data: { balanceUsd: { increment: providerEarnings } },
    }).catch(() => {});

    escrow.amountSettledUsd = actualCost;
    escrow.amountRefundedUsd = amountRefunded;
    escrow.status = EscrowStatus.SETTLED;
    escrow.settledAt = new Date().toISOString();

    const settleTx: WalletTransaction = {
      id: `tx-set-${dto.jobId}`,
      userId: escrow.customerId,
      type: TransactionType.ESCROW_SETTLE,
      amountUsd: actualCost,
      currency: 'USD',
      referenceId: dto.jobId,
      description: `Escrow Settlement for Job ${dto.jobId.substring(0, 8)}`,
      status: 'CONFIRMED',
      createdAt: new Date().toISOString(),
    };

    if (redisClient && redisHealthy) {
      await redisClient.set(`escrow:job:${dto.jobId}`, JSON.stringify(escrow));
      await redisClient.set(`escrow:user:${escrow.customerId}:${dto.jobId}`, JSON.stringify(escrow));
      await redisClient.lpush(`wallet:txs:${escrow.customerId}`, JSON.stringify(settleTx));
    }

    this.logger.log(`Settled escrow for job ${dto.jobId}: Cost=$${actualCost}, Refund=$${amountRefunded}`);
    return escrow;
  }

  async refundEscrow(jobId: string, reason: string): Promise<EscrowHold> {
    const redisClient = this.redis.getClient();
    const redisHealthy = await this.redis.isHealthy();

    let escrow: EscrowHold | null = null;
    if (redisClient && redisHealthy) {
      const raw = await redisClient.get(`escrow:job:${jobId}`);
      if (raw) {
        try {
          escrow = JSON.parse(raw);
        } catch {}
      }
    }

    if (!escrow) {
      throw new NotFoundException(`Escrow contract for job ${jobId} not found`);
    }

    // 100% refund of locked funds
    const refundAmount = escrow.amountLockedUsd;
    await this.prisma.user.update({
      where: { id: escrow.customerId },
      data: { balanceUsd: { increment: refundAmount } },
    });

    escrow.amountRefundedUsd = refundAmount;
    escrow.amountSettledUsd = 0;
    escrow.status = EscrowStatus.REFUNDED;
    escrow.settledAt = new Date().toISOString();

    const refundTx: WalletTransaction = {
      id: `tx-cancel-${jobId}`,
      userId: escrow.customerId,
      type: TransactionType.ESCROW_REFUND,
      amountUsd: refundAmount,
      currency: 'USD',
      referenceId: jobId,
      description: `Full Escrow Refund (${reason})`,
      status: 'CONFIRMED',
      createdAt: new Date().toISOString(),
    };

    if (redisClient && redisHealthy) {
      await redisClient.set(`escrow:job:${jobId}`, JSON.stringify(escrow));
      await redisClient.set(`escrow:user:${escrow.customerId}:${jobId}`, JSON.stringify(escrow));
      await redisClient.lpush(`wallet:txs:${escrow.customerId}`, JSON.stringify(refundTx));
    }

    this.logger.log(`Fully refunded escrow for job ${jobId} ($${refundAmount})`);
    return escrow;
  }
}
