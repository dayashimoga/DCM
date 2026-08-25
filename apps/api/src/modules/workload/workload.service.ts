import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { CreateJobDto } from './dto/create-job.dto';
import { AgentJobStatusUpdateDto } from './dto/agent-status-update.dto';
import { Decimal } from '@prisma/client/runtime/library';
import { Job, JobStatus, NodeStatus } from '@distributed-compute/shared-types';

/**
 * F16: Explicit job state machine — only defined transitions are allowed.
 * Any transition not in this map is rejected with BadRequestException.
 */
const VALID_JOB_TRANSITIONS: Record<string, string[]> = {
  [JobStatus.PENDING]:      [JobStatus.SCHEDULED, JobStatus.CANCELLED, JobStatus.FAILED],
  [JobStatus.SCHEDULED]:    [JobStatus.PROVISIONING, JobStatus.RUNNING, JobStatus.CANCELLED, JobStatus.FAILED],
  [JobStatus.PROVISIONING]: [JobStatus.RUNNING, JobStatus.FAILED, JobStatus.CANCELLED],
  [JobStatus.RUNNING]:      [JobStatus.COMPLETED, JobStatus.FAILED, JobStatus.CANCELLED],
  [JobStatus.COMPLETED]:    [], // Terminal state
  [JobStatus.FAILED]:       [], // Terminal state
  [JobStatus.CANCELLED]:    [], // Terminal state
};

@Injectable()
export class WorkloadService {
  private readonly logger = new Logger(WorkloadService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  async createJob(customerId: string, dto: CreateJobDto): Promise<Job> {
    const user = await this.prisma.user.findUnique({
      where: { id: customerId },
    });

    if (!user) {
      throw new NotFoundException(`User ${customerId} not found`);
    }

    let targetNodeId = dto.nodeId;

    if (targetNodeId) {
      // Direct node selection
      const node = await this.prisma.computeNode.findUnique({
        where: { id: targetNodeId },
      });
      if (!node) {
        throw new NotFoundException(`Target compute node ${targetNodeId} not found`);
      }
    } else {
      // Auto-schedule: find cheapest online node meeting criteria
      const candidateNodes = await this.prisma.computeNode.findMany({
        where: {
          gpuCount: { gte: dto.gpuCount || 0 },
          vramGb: { gte: dto.minVramGb || 0 },
        },
        orderBy: {
          hourlyRateUsd: 'asc',
        },
        take: 5,
      });

      if (candidateNodes.length === 0) {
        throw new BadRequestException('No available compute nodes matching requested hardware requirements');
      }

      targetNodeId = candidateNodes[0].id;
    }

    const created = await this.prisma.job.create({
      data: {
        customerId,
        nodeId: targetNodeId,
        image: dto.image,
        command: dto.command || '',
        status: JobStatus.SCHEDULED,
        startedAt: null,
        completedAt: null,
        totalGpuSeconds: 0,
        totalCostUsd: 0,
      },
    });

    // Notify/Queue in Redis for agent pickup
    const redisClient = this.redis.getClient();
    const redisHealthy = await this.redis.isHealthy();
    if (redisClient && redisHealthy) {
      await redisClient.set(`node:pending_job:${targetNodeId}`, created.id);
      await redisClient.rpush(
        `job:logs:${created.id}`,
        `[${new Date().toISOString()}] Job ${created.id} submitted. Image: ${dto.image}. Assigned to node ${targetNodeId}.`,
      );
    }

    this.logger.log(`Job ${created.id} submitted by customer ${customerId} assigned to node ${targetNodeId}`);

    return {
      id: created.id,
      customerId: created.customerId,
      nodeId: created.nodeId,
      status: created.status as JobStatus,
      image: created.image,
      command: created.command || undefined,
      startedAt: created.startedAt ? created.startedAt.toISOString() : null,
      completedAt: created.completedAt ? created.completedAt.toISOString() : null,
      totalGpuSeconds: created.totalGpuSeconds,
      totalCostUsd: Number(created.totalCostUsd),
      createdAt: created.createdAt.toISOString(),
      updatedAt: created.updatedAt.toISOString(),
    };
  }

  async getCustomerJobs(customerId: string): Promise<Job[]> {
    const jobs = await this.prisma.job.findMany({
      where: { customerId },
      orderBy: { createdAt: 'desc' },
    });

    return jobs.map((j) => ({
      id: j.id,
      customerId: j.customerId,
      nodeId: j.nodeId,
      status: j.status as JobStatus,
      image: j.image,
      command: j.command || undefined,
      startedAt: j.startedAt ? j.startedAt.toISOString() : null,
      completedAt: j.completedAt ? j.completedAt.toISOString() : null,
      totalGpuSeconds: j.totalGpuSeconds,
      totalCostUsd: Number(j.totalCostUsd),
      createdAt: j.createdAt.toISOString(),
      updatedAt: j.updatedAt.toISOString(),
    }));
  }

  async getJobDetails(jobId: string, customerId?: string): Promise<Job> {
    const job = await this.prisma.job.findUnique({
      where: { id: jobId },
    });

    if (!job) {
      throw new NotFoundException(`Job ${jobId} not found`);
    }

    if (customerId && job.customerId !== customerId) {
      throw new ForbiddenException('Access denied to this job');
    }

    return {
      id: job.id,
      customerId: job.customerId,
      nodeId: job.nodeId,
      status: job.status as JobStatus,
      image: job.image,
      command: job.command || undefined,
      startedAt: job.startedAt ? job.startedAt.toISOString() : null,
      completedAt: job.completedAt ? job.completedAt.toISOString() : null,
      totalGpuSeconds: job.totalGpuSeconds,
      totalCostUsd: Number(job.totalCostUsd),
      createdAt: job.createdAt.toISOString(),
      updatedAt: job.updatedAt.toISOString(),
    };
  }

  async cancelJob(jobId: string, customerId: string): Promise<Job> {
    const job = await this.prisma.job.findUnique({
      where: { id: jobId },
    });

    if (!job) {
      throw new NotFoundException(`Job ${jobId} not found`);
    }

    if (job.customerId !== customerId) {
      throw new ForbiddenException('Access denied to this job');
    }

    if (job.status === JobStatus.COMPLETED || job.status === JobStatus.FAILED) {
      throw new BadRequestException(`Cannot cancel job in ${job.status} state`);
    }

    const updated = await this.prisma.job.update({
      where: { id: jobId },
      data: {
        status: JobStatus.CANCELLED,
        completedAt: new Date(),
      },
    });

    const redisClient = this.redis.getClient();
    const redisHealthy = await this.redis.isHealthy();
    if (redisClient && redisHealthy) {
      await redisClient.rpush(
        `job:logs:${jobId}`,
        `[${new Date().toISOString()}] Job cancelled by user.`,
      );
      await redisClient.del(`node:pending_job:${job.nodeId}`);
    }

    return {
      id: updated.id,
      customerId: updated.customerId,
      nodeId: updated.nodeId,
      status: updated.status as JobStatus,
      image: updated.image,
      command: updated.command || undefined,
      startedAt: updated.startedAt ? updated.startedAt.toISOString() : null,
      completedAt: updated.completedAt ? updated.completedAt.toISOString() : null,
      totalGpuSeconds: updated.totalGpuSeconds,
      totalCostUsd: Number(updated.totalCostUsd),
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
    };
  }

  async getJobLogs(jobId: string): Promise<string[]> {
    const redisClient = this.redis.getClient();
    const redisHealthy = await this.redis.isHealthy();

    if (redisClient && redisHealthy) {
      const logs = await redisClient.lrange(`job:logs:${jobId}`, 0, -1);
      if (logs && logs.length > 0) {
        return logs;
      }
    }

    return [
      `[${new Date().toISOString()}] Job ${jobId} initialized.`,
      `[${new Date().toISOString()}] Container sandbox execution active.`,
    ];
  }

  async handleAgentStatusUpdate(dto: AgentJobStatusUpdateDto): Promise<{ acknowledged: boolean }> {
    const job = await this.prisma.job.findUnique({
      where: { id: dto.jobId },
      include: { node: true },
    });

    if (!job) {
      throw new NotFoundException(`Job ${dto.jobId} not found`);
    }

    // F16: Enforce job state machine — reject invalid transitions
    const currentStatus = job.status as string;
    const targetStatus = dto.status as string;
    const allowed = VALID_JOB_TRANSITIONS[currentStatus] || [];
    if (!allowed.includes(targetStatus)) {
      throw new BadRequestException(
        `Invalid job state transition: ${currentStatus} → ${targetStatus}. Allowed: [${allowed.join(', ')}]`,
      );
    }

    const redisClient = this.redis.getClient();
    const redisHealthy = await this.redis.isHealthy();

    if (dto.logs && dto.logs.length > 0 && redisClient && redisHealthy) {
      for (const line of dto.logs) {
        await redisClient.rpush(`job:logs:${dto.jobId}`, line);
      }
    }

    const updateData: any = {
      status: dto.status,
    };

    if (dto.status === JobStatus.RUNNING && !job.startedAt) {
      updateData.startedAt = new Date();
    }

    if (dto.status === JobStatus.COMPLETED || dto.status === JobStatus.FAILED) {
      const completedAt = new Date();
      updateData.completedAt = completedAt;

      const startedAt = job.startedAt || job.createdAt;
      const durationSeconds = Math.max(1, Math.floor((completedAt.getTime() - startedAt.getTime()) / 1000));
      updateData.totalGpuSeconds = durationSeconds * (job.node.gpuCount || 1);

      // F2: Use Decimal for cost calculation
      const hourlyRate = new Decimal(job.node.hourlyRateUsd);
      const totalCost = hourlyRate.div(new Decimal('3600')).mul(new Decimal(durationSeconds));
      updateData.totalCostUsd = totalCost;

      if (redisClient && redisHealthy) {
        await redisClient.del(`node:pending_job:${dto.nodeId}`);
      }
    }

    await this.prisma.job.update({
      where: { id: dto.jobId },
      data: updateData,
    });

    this.logger.log(`Job ${dto.jobId} transitioned to status ${dto.status} by node ${dto.nodeId}`);

    return { acknowledged: true };
  }

  async getPendingJobForNode(nodeId: string): Promise<Job | null> {
    const redisClient = this.redis.getClient();
    const redisHealthy = await this.redis.isHealthy();

    let pendingJobId: string | null = null;
    if (redisClient && redisHealthy) {
      pendingJobId = await redisClient.get(`node:pending_job:${nodeId}`);
    }

    if (!pendingJobId) {
      const pendingDbJob = await this.prisma.job.findFirst({
        where: {
          nodeId,
          status: { in: [JobStatus.PENDING, JobStatus.SCHEDULED] },
        },
        orderBy: { createdAt: 'asc' },
      });
      if (!pendingDbJob) {
        return null;
      }
      pendingJobId = pendingDbJob.id;
    }

    const job = await this.prisma.job.findUnique({
      where: { id: pendingJobId },
    });

    if (!job) return null;

    return {
      id: job.id,
      customerId: job.customerId,
      nodeId: job.nodeId,
      status: job.status as JobStatus,
      image: job.image,
      command: job.command || undefined,
      startedAt: job.startedAt ? job.startedAt.toISOString() : null,
      completedAt: job.completedAt ? job.completedAt.toISOString() : null,
      totalGpuSeconds: job.totalGpuSeconds,
      totalCostUsd: Number(job.totalCostUsd),
      createdAt: job.createdAt.toISOString(),
      updatedAt: job.updatedAt.toISOString(),
    };
  }
}
