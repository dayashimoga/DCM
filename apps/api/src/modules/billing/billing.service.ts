import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { UsageTickDto } from './dto/usage-tick.dto';
import {
  UsageRecord,
  UsageLedgerSummary,
  ProviderEarningsSummary,
  Invoice,
  BalanceDeductionEvent,
  JobStatus,
} from '@distributed-compute/shared-types';

@Injectable()
export class BillingService {
  private readonly logger = new Logger(BillingService.name);
  private readonly PLATFORM_FEE_PERCENT = 0.15; // 15% marketplace commission

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  async recordUsageTick(dto: UsageTickDto): Promise<BalanceDeductionEvent> {
    const job = await this.prisma.job.findUnique({
      where: { id: dto.jobId },
      include: { node: true, customer: true },
    });

    if (!job) {
      throw new NotFoundException(`Job ${dto.jobId} not found`);
    }

    const hourlyRate = Number(job.node.hourlyRateUsd);
    const durationSeconds = dto.durationSeconds;

    // Sub-second accurate cost calculation
    const tickCostUsd = parseFloat(((hourlyRate / 3600) * durationSeconds).toFixed(6));
    const platformFeeUsd = parseFloat((tickCostUsd * this.PLATFORM_FEE_PERCENT).toFixed(6));
    const providerEarningsUsd = parseFloat((tickCostUsd - platformFeeUsd).toFixed(6));

    const customer = job.customer;
    const currentBalance = Number(customer.balanceUsd);
    const newBalance = Math.max(0, currentBalance - tickCostUsd);

    // Update job metrics
    await this.prisma.job.update({
      where: { id: job.id },
      data: {
        totalGpuSeconds: { increment: durationSeconds },
        totalCostUsd: { increment: tickCostUsd },
      },
    });

    // Deduct user balance
    await this.prisma.user.update({
      where: { id: customer.id },
      data: {
        balanceUsd: newBalance,
      },
    });

    // Check for depleted balance protection
    let status: 'SUCCESS' | 'DEPLETED' | 'TERMINATED' = 'SUCCESS';
    if (newBalance <= 0) {
      status = 'DEPLETED';
      await this.prisma.job.update({
        where: { id: job.id },
        data: { status: JobStatus.CANCELLED },
      });

      this.logger.warn(`Job ${job.id} auto-terminated due to zero balance for user ${customer.id}`);
    }

    const usageRecord: UsageRecord = {
      id: `usg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      jobId: job.id,
      customerId: customer.id,
      providerId: job.node.providerId,
      nodeId: job.node.id,
      gpuSeconds: durationSeconds,
      cpuSeconds: dto.cpuSeconds || durationSeconds,
      ramGbSeconds: dto.ramGbSeconds || 0,
      hourlyRateUsd: hourlyRate,
      costUsd: tickCostUsd,
      providerEarningsUsd,
      platformFeeUsd,
      timestamp: new Date().toISOString(),
    };

    // Cache record in Redis
    const redisClient = this.redis.getClient();
    const redisHealthy = await this.redis.isHealthy();
    if (redisClient && redisHealthy) {
      await redisClient.lpush(`user:usage:${customer.id}`, JSON.stringify(usageRecord));
      await redisClient.lpush(`provider:earnings:${job.node.providerId}`, JSON.stringify(usageRecord));

      if (status === 'DEPLETED') {
        await redisClient.rpush(
          `job:logs:${job.id}`,
          `[${new Date().toISOString()}] [BILLING] Account balance depleted ($0.00). Workload automatically stopped to prevent overdraft.`,
        );
      }
    }

    return {
      userId: customer.id,
      jobId: job.id,
      amountDeductedUsd: tickCostUsd,
      remainingBalanceUsd: parseFloat(newBalance.toFixed(4)),
      status,
      timestamp: new Date().toISOString(),
    };
  }

  async getCustomerUsage(customerId: string): Promise<UsageLedgerSummary> {
    const jobs = await this.prisma.job.findMany({
      where: { customerId },
      include: { node: true },
      orderBy: { createdAt: 'desc' },
    });

    let totalGpuSeconds = 0;
    let totalCostUsd = 0;
    let currentBurnRate = 0;
    let activeJobsCount = 0;

    jobs.forEach((j) => {
      totalGpuSeconds += j.totalGpuSeconds;
      totalCostUsd += Number(j.totalCostUsd);
      if (j.status === JobStatus.RUNNING) {
        currentBurnRate += Number(j.node.hourlyRateUsd);
        activeJobsCount += 1;
      }
    });

    // Retrieve recent usage records
    const records: UsageRecord[] = jobs.map((j) => ({
      id: `usg-${j.id.substring(0, 8)}`,
      jobId: j.id,
      customerId,
      providerId: j.node.providerId,
      nodeId: j.node.id,
      gpuSeconds: j.totalGpuSeconds,
      cpuSeconds: j.totalGpuSeconds,
      ramGbSeconds: j.totalGpuSeconds * 16,
      hourlyRateUsd: Number(j.node.hourlyRateUsd),
      costUsd: Number(j.totalCostUsd),
      providerEarningsUsd: parseFloat((Number(j.totalCostUsd) * 0.85).toFixed(4)),
      platformFeeUsd: parseFloat((Number(j.totalCostUsd) * 0.15).toFixed(4)),
      timestamp: j.updatedAt.toISOString(),
    }));

    return {
      customerId,
      totalGpuSeconds,
      totalCostUsd: parseFloat(totalCostUsd.toFixed(4)),
      currentBurnRateUsdPerHour: parseFloat(currentBurnRate.toFixed(4)),
      activeJobsCount,
      records,
    };
  }

  async getProviderEarnings(providerId: string): Promise<ProviderEarningsSummary> {
    const nodes = await this.prisma.computeNode.findMany({
      where: { providerId },
      include: { jobs: true },
    });

    let totalGrossEarnings = 0;
    let totalComputeSecondsServed = 0;

    nodes.forEach((node) => {
      node.jobs.forEach((j) => {
        totalGrossEarnings += Number(j.totalCostUsd);
        totalComputeSecondsServed += j.totalGpuSeconds;
      });
    });

    const totalPlatformFees = parseFloat((totalGrossEarnings * this.PLATFORM_FEE_PERCENT).toFixed(4));
    const totalNetEarnings = parseFloat((totalGrossEarnings - totalPlatformFees).toFixed(4));

    return {
      providerId,
      totalGrossEarningsUsd: parseFloat(totalGrossEarnings.toFixed(4)),
      totalPlatformFeesUsd: totalPlatformFees,
      totalNetEarningsUsd: totalNetEarnings,
      pendingPayoutUsd: totalNetEarnings,
      totalComputeSecondsServed,
    };
  }

  async generateInvoice(userId: string, periodDays = 30): Promise<Invoice> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException(`User ${userId} not found`);
    }

    const usage = await this.getCustomerUsage(userId);
    const lineItems = usage.records.map((r) => ({
      description: `Compute Lease - Job ${r.jobId.substring(0, 8)} (${r.gpuSeconds}s @ $${r.hourlyRateUsd}/hr)`,
      quantity: parseFloat((r.gpuSeconds / 3600).toFixed(4)),
      unit: 'GPU-Hours',
      unitPriceUsd: r.hourlyRateUsd,
      amountUsd: r.costUsd,
    }));

    if (lineItems.length === 0) {
      lineItems.push({
        description: 'Standard Compute Platform Account Activation',
        quantity: 1,
        unit: 'Fixed',
        unitPriceUsd: 0.00,
        amountUsd: 0.00,
      });
    }

    const subtotal = usage.totalCostUsd;
    const platformFee = parseFloat((subtotal * 0.15).toFixed(4));
    const now = new Date();
    const startDate = new Date(now.getTime() - periodDays * 24 * 60 * 60 * 1000);

    return {
      id: `inv-${Date.now().toString(36)}`,
      invoiceNumber: `INV-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      userId,
      periodStart: startDate.toISOString(),
      periodEnd: now.toISOString(),
      subtotalUsd: subtotal,
      platformFeeUsd: platformFee,
      totalUsd: subtotal,
      status: 'PAID',
      lineItems,
      createdAt: now.toISOString(),
    };
  }

  async addMockCredits(userId: string, amountUsd: number): Promise<{ balanceUsd: number }> {
    if (amountUsd <= 0) {
      throw new BadRequestException('Amount must be positive');
    }

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: {
        balanceUsd: { increment: amountUsd },
      },
    });

    return { balanceUsd: Number(updated.balanceUsd) };
  }
}
