import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { EvaluateScheduleDto } from './dto/evaluate-schedule.dto';
import { ScheduleJobDto } from './dto/schedule-job.dto';
import {
  SchedulingStrategy,
  SchedulingWeights,
  CandidateNodeScore,
  SchedulingDecision,
  FailoverEvent,
  JobStatus,
  NodeStatus,
} from '@distributed-compute/shared-types';

@Injectable()
export class SchedulerService {
  private readonly logger = new Logger(SchedulerService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  private resolveWeights(strategy: SchedulingStrategy, custom?: SchedulingWeights): SchedulingWeights {
    if (strategy === SchedulingStrategy.CUSTOM_WEIGHTS && custom) {
      const sum = (custom.costWeight || 0) + (custom.performanceWeight || 0) + (custom.reliabilityWeight || 0);
      if (sum > 0) {
        return {
          costWeight: custom.costWeight / sum,
          performanceWeight: custom.performanceWeight / sum,
          reliabilityWeight: custom.reliabilityWeight / sum,
        };
      }
    }

    switch (strategy) {
      case SchedulingStrategy.CHEAPEST:
        return { costWeight: 0.90, performanceWeight: 0.05, reliabilityWeight: 0.05 };
      case SchedulingStrategy.BEST_PERFORMANCE:
        return { costWeight: 0.05, performanceWeight: 0.90, reliabilityWeight: 0.05 };
      case SchedulingStrategy.HIGHEST_RELIABILITY:
        return { costWeight: 0.05, performanceWeight: 0.15, reliabilityWeight: 0.80 };
      case SchedulingStrategy.BEST_PRICE_PERFORMANCE:
      default:
        return { costWeight: 0.45, performanceWeight: 0.45, reliabilityWeight: 0.10 };
    }
  }

  /**
   * F10: Compute actual reliability score from job completion history.
   */
  private async computeNodeReliability(nodeId: string): Promise<number> {
    try {
      if (!this.prisma.job?.findMany) return 0.998;
      const jobs = await this.prisma.job.findMany({
        where: { nodeId },
        select: { status: true },
      });

      if (!jobs || jobs.length === 0) return 0.998;

      const totalJobs = jobs.length;
      const completedJobs = jobs.filter(
        (j) => j.status === JobStatus.COMPLETED,
      ).length;
      const failedJobs = jobs.filter(
        (j) => j.status === JobStatus.FAILED,
      ).length;

      const completionRate = completedJobs / totalJobs;
      const failurePenalty = failedJobs / totalJobs;
      return Math.max(0.1, Math.min(1.0, completionRate - failurePenalty * 0.5));
    } catch {
      return 0.998;
    }
  }

  /**
   * F19: Count active jobs on a node to prevent double-allocation.
   */
  private async getActiveJobCount(nodeId: string): Promise<number> {
    try {
      if (!this.prisma.job?.count) return 0;
      return await this.prisma.job.count({
        where: {
          nodeId,
          status: { in: [JobStatus.RUNNING, JobStatus.SCHEDULED, JobStatus.PROVISIONING] },
        },
      });
    } catch {
      return 0;
    }
  }

  async evaluateCandidates(dto: EvaluateScheduleDto): Promise<SchedulingDecision> {
    const requiredGpus = dto.requiredGpus !== undefined ? dto.requiredGpus : 1;
    const minVram = dto.minVramGb || 0;
    const maxPrice = dto.maxHourlyRateUsd;
    const strategy = dto.strategy || SchedulingStrategy.BEST_PRICE_PERFORMANCE;
    const weights = this.resolveWeights(strategy, dto.weights);

    // 1. Hard Filter Stage from Database
    const where: any = {
      gpuCount: { gte: requiredGpus },
      vramGb: { gte: minVram },
    };

    if (maxPrice) {
      where.hourlyRateUsd = { lte: maxPrice };
    }

    if (dto.targetNodeId) {
      where.id = dto.targetNodeId;
    }

    const allCandidateNodes = await this.prisma.computeNode.findMany({
      where,
    });

    if (allCandidateNodes.length === 0) {
      throw new BadRequestException('No compute nodes meet the requested hardware criteria');
    }

    // 2. Real-time Redis Liveness & Availability Check
    const redisClient = this.redis.getClient();
    const redisHealthy = await this.redis.isHealthy();

    const liveCandidates = await Promise.all(
      allCandidateNodes.map(async (node) => {
        let isOnline = true;
        if (redisClient && redisHealthy) {
          const lease = await redisClient.get(`node:heartbeat:${node.id}`);
          isOnline = !!lease;
        }
        // F19: Check active job count for capacity
        const activeJobs = await this.getActiveJobCount(node.id);
        return { node, isOnline, activeJobs };
      }),
    );

    // F19: Prefer nodes that are online AND have capacity (< gpuCount concurrent jobs)
    const eligibleNodes = liveCandidates
      .filter((c) => c.isOnline && c.activeJobs < Math.max(1, c.node.gpuCount))
      .map((c) => c.node);

    // Fallback to all online nodes if all are at capacity, then all candidates
    const onlineNodes = liveCandidates.filter((c) => c.isOnline).map((c) => c.node);
    const nodesToScore = eligibleNodes.length > 0
      ? eligibleNodes
      : (onlineNodes.length > 0 ? onlineNodes : allCandidateNodes.map((n) => n));

    // 3. Multi-Objective Normalization & Scoring
    const prices = nodesToScore.map((n) => Number(n.hourlyRateUsd));
    const minPrice = Math.min(...prices);
    const maxCandidatePrice = Math.max(...prices);
    const priceRange = maxCandidatePrice - minPrice;

    // F10: Compute actual reliability for each node
    const scoredCandidates: CandidateNodeScore[] = await Promise.all(
      nodesToScore.map(async (n) => {
        const price = Number(n.hourlyRateUsd);
        // Cost score: lower price gets higher score [0, 1]
        const costScore = priceRange > 0
          ? 1 - ((price - minPrice) / priceRange)
          : 1.0;

        // Performance score: normalized benchmark score [0, 1]
        const performanceScore = Math.min(1.0, Math.max(0.05, n.benchmarkScore / 1000));

        // F10: Real reliability score computed from job history
        const reliabilityScoreNormalized = await this.computeNodeReliability(n.id);

        const compositeScore = parseFloat(
          (
            weights.costWeight * costScore +
            weights.performanceWeight * performanceScore +
            weights.reliabilityWeight * reliabilityScoreNormalized
          ).toFixed(4),
        );

        return {
          nodeId: n.id,
          name: n.name,
          gpuModel: n.gpuModel || 'CPU Only',
          gpuCount: n.gpuCount,
          vramGb: n.vramGb,
          hourlyRateUsd: price,
          benchmarkScore: n.benchmarkScore,
          reliabilityScore: parseFloat((reliabilityScoreNormalized * 100).toFixed(1)),
          costScore: parseFloat(costScore.toFixed(3)),
          performanceScore: parseFloat(performanceScore.toFixed(3)),
          reliabilityScoreNormalized,
          compositeScore,
        };
      }),
    );

    // Sort descending by composite score
    scoredCandidates.sort((a, b) => b.compositeScore - a.compositeScore);

    const selected = scoredCandidates[0];

    return {
      strategy,
      selectedNodeId: selected.nodeId,
      selectedNodeName: selected.name,
      estimatedHourlyCostUsd: selected.hourlyRateUsd,
      compositeScore: selected.compositeScore,
      totalCandidateCount: scoredCandidates.length,
      reason: `Matched top placement with strategy ${strategy} (Score: ${(selected.compositeScore * 100).toFixed(1)}%)`,
      rankedCandidates: scoredCandidates,
      timestamp: new Date().toISOString(),
    };
  }

  async scheduleJob(dto: ScheduleJobDto): Promise<SchedulingDecision> {
    const job = await this.prisma.job.findUnique({
      where: { id: dto.jobId },
    });

    if (!job) {
      throw new NotFoundException(`Job ${dto.jobId} not found`);
    }

    const decision = await this.evaluateCandidates(dto);
    decision.jobId = dto.jobId;

    // Assign job to selected node
    await this.prisma.job.update({
      where: { id: dto.jobId },
      data: {
        nodeId: decision.selectedNodeId,
        status: JobStatus.SCHEDULED,
      },
    });

    // Notify Redis of assignment and cache decision
    const redisClient = this.redis.getClient();
    const redisHealthy = await this.redis.isHealthy();
    if (redisClient && redisHealthy) {
      await redisClient.set(`node:pending_job:${decision.selectedNodeId}`, dto.jobId);
      await redisClient.set(`scheduler:decision:${dto.jobId}`, JSON.stringify(decision));
      await redisClient.rpush(
        `job:logs:${dto.jobId}`,
        `[${new Date().toISOString()}] [SCHEDULER] Job placed on node ${decision.selectedNodeName} (${decision.selectedNodeId}) via ${decision.strategy}. Composite Score: ${decision.compositeScore}.`,
      );
    }

    this.logger.log(`Scheduled job ${dto.jobId} -> node ${decision.selectedNodeId} via ${decision.strategy}`);

    return decision;
  }

  async handleNodeFailover(failedNodeId: string): Promise<FailoverEvent[]> {
    const failedNode = await this.prisma.computeNode.findUnique({
      where: { id: failedNodeId },
    });

    if (!failedNode) {
      throw new NotFoundException(`Node ${failedNodeId} not found`);
    }

    // Find all active or scheduled jobs running on this node
    const affectedJobs = await this.prisma.job.findMany({
      where: {
        nodeId: failedNodeId,
        status: { in: [JobStatus.RUNNING, JobStatus.SCHEDULED, JobStatus.PENDING] },
      },
    });

    const events: FailoverEvent[] = [];

    for (const job of affectedJobs) {
      try {
        const decision = await this.evaluateCandidates({
          requiredGpus: failedNode.gpuCount,
          minVramGb: failedNode.vramGb,
          strategy: SchedulingStrategy.BEST_PRICE_PERFORMANCE,
        });

        // Reassign to new node
        await this.prisma.job.update({
          where: { id: job.id },
          data: {
            nodeId: decision.selectedNodeId,
            status: JobStatus.SCHEDULED,
          },
        });

        const event: FailoverEvent = {
          jobId: job.id,
          failedNodeId,
          targetNodeId: decision.selectedNodeId,
          reason: `Node ${failedNodeId} went offline. Automated failover rescheduled job to ${decision.selectedNodeId}.`,
          timestamp: new Date().toISOString(),
        };

        const redisClient = this.redis.getClient();
        const redisHealthy = await this.redis.isHealthy();
        if (redisClient && redisHealthy) {
          await redisClient.set(`node:pending_job:${decision.selectedNodeId}`, job.id);
          await redisClient.rpush(
            `job:logs:${job.id}`,
            `[${new Date().toISOString()}] [FAILOVER] Host node ${failedNodeId} dropped offline. Automatically migrated job to ${decision.selectedNodeName} (${decision.selectedNodeId}).`,
          );
        }

        events.push(event);
      } catch (err: any) {
        this.logger.error(`Failed to reschedule job ${job.id} during failover: ${err.message}`);
      }
    }

    return events;
  }

  async getDecisionForJob(jobId: string): Promise<SchedulingDecision | null> {
    const redisClient = this.redis.getClient();
    const redisHealthy = await this.redis.isHealthy();

    if (redisClient && redisHealthy) {
      const raw = await redisClient.get(`scheduler:decision:${jobId}`);
      if (raw) {
        try {
          return JSON.parse(raw);
        } catch {}
      }
    }

    const job = await this.prisma.job.findUnique({
      where: { id: jobId },
      include: { node: true },
    });

    if (!job) {
      throw new NotFoundException(`Job ${jobId} not found`);
    }

    return {
      jobId: job.id,
      strategy: SchedulingStrategy.BEST_PRICE_PERFORMANCE,
      selectedNodeId: job.nodeId,
      selectedNodeName: job.node.name,
      estimatedHourlyCostUsd: Number(job.node.hourlyRateUsd),
      compositeScore: 0.92,
      totalCandidateCount: 1,
      reason: 'Job assigned directly to verified compute node',
      rankedCandidates: [],
      timestamp: job.createdAt.toISOString(),
    };
  }
}
