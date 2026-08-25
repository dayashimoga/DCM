import {
  Injectable,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { MarketplaceFilterDto } from './dto/marketplace-filter.dto';
import {
  ComputeNode,
  NodeStatus,
  ComputeTier,
  HardwareVerificationStatus,
  MarketplaceListResponse,
  MarketplaceSummary,
  SortByOption,
  TelemetryMetrics,
} from '@distributed-compute/shared-types';

@Injectable()
export class MarketplaceService {
  private readonly logger = new Logger(MarketplaceService.name);
  private cachedSummary: { data: MarketplaceSummary; expiresAt: number } | null = null;
  private cachedList: Map<string, { data: MarketplaceListResponse; expiresAt: number }> = new Map();

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  async searchNodes(filter: MarketplaceFilterDto): Promise<MarketplaceListResponse> {
    const cacheKey = JSON.stringify(filter);
    const cached = this.cachedList.get(cacheKey);
    if (cached && Date.now() < cached.expiresAt) {
      return cached.data;
    }

    const page = filter.page || 1;
    const limit = filter.limit || 20;
    const skip = (page - 1) * limit;

    // Build database query filters
    const where: any = {};

    if (filter.searchQuery) {
      const q = filter.searchQuery.trim();
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { gpuModel: { contains: q, mode: 'insensitive' } },
        { cpuModel: { contains: q, mode: 'insensitive' } },
      ];
    }

    if (filter.gpuModel) {
      where.gpuModel = { contains: filter.gpuModel, mode: 'insensitive' };
    }

    if (filter.minVramGb !== undefined) {
      where.vramGb = { gte: filter.minVramGb };
    }

    if (filter.maxHourlyRateUsd !== undefined) {
      where.hourlyRateUsd = { lte: filter.maxHourlyRateUsd };
    }

    if (filter.minBenchmarkScore !== undefined) {
      where.benchmarkScore = { gte: filter.minBenchmarkScore };
    }

    // Determine sorting criteria
    const orderBy: any = {};
    switch (filter.sortBy) {
      case SortByOption.PRICE_DESC:
        orderBy.hourlyRateUsd = 'desc';
        break;
      case SortByOption.SCORE_DESC:
        orderBy.benchmarkScore = 'desc';
        break;
      case SortByOption.VRAM_DESC:
        orderBy.vramGb = 'desc';
        break;
      case SortByOption.PRICE_ASC:
      default:
        orderBy.hourlyRateUsd = 'asc';
        break;
    }

    const [total, dbNodes] = await Promise.all([
      this.prisma.computeNode.count({ where }),
      this.prisma.computeNode.findMany({
        where,
        orderBy,
        skip,
        take: limit,
      }),
    ]);

    const redisClient = this.redis.getClient();
    const redisHealthy = await this.redis.isHealthy();

    const nodes: ComputeNode[] = await Promise.all(
      dbNodes.map(async (n) => {
        let isOnline = true;
        let telemetry: TelemetryMetrics | undefined;

        if (redisClient && redisHealthy) {
          const lease = await redisClient.get(`node:heartbeat:${n.id}`);
          isOnline = !!lease;
          const rawTelemetry = await redisClient.get(`node:telemetry:${n.id}`);
          if (rawTelemetry) {
            try {
              telemetry = JSON.parse(rawTelemetry);
            } catch {}
          }
        }

        const tier = n.vramGb >= 80
          ? ComputeTier.TIER_1_ENTERPRISE_GPU
          : n.vramGb >= 24
          ? ComputeTier.TIER_2_PRO_GPU
          : n.vramGb > 0
          ? ComputeTier.TIER_3_CONSUMER_GPU
          : ComputeTier.TIER_4_CPU_ONLY;

        return {
          id: n.id,
          providerId: n.providerId,
          name: n.name,
          status: isOnline ? (n.status as NodeStatus) : NodeStatus.OFFLINE,
          cpu: {
            model: n.cpuModel,
            cores: n.cpuCores,
            threads: n.cpuCores * 2,
          },
          gpus: n.gpuModel
            ? [
                {
                  model: n.gpuModel,
                  vendor: 'NVIDIA',
                  vramGb: n.vramGb,
                  count: n.gpuCount,
                },
              ]
            : [],
          ramGb: n.ramGb,
          diskGb: n.diskGb,
          hourlyRateUsd: Number(n.hourlyRateUsd),
          benchmarkScore: n.benchmarkScore,
          computeTier: tier,
          verificationStatus: HardwareVerificationStatus.VERIFIED,
          reliabilityScore: 99.8,
          lastHeartbeat: n.lastHeartbeat.toISOString(),
          latestTelemetry: telemetry,
          createdAt: n.createdAt.toISOString(),
        };
      }),
    );

    // Filter by tier in memory if requested
    const filteredNodes = filter.tier ? nodes.filter((n) => n.computeTier === filter.tier) : nodes;

    const totalOnlineGpus = filteredNodes.reduce(
      (acc, n) => acc + (n.status === NodeStatus.ONLINE ? (n.gpus[0]?.count || 0) : 0),
      0,
    );
    const totalVramGb = filteredNodes.reduce(
      (acc, n) => acc + (n.gpus[0]?.vramGb || 0) * (n.gpus[0]?.count || 1),
      0,
    );
    const lowestRate = filteredNodes.length > 0
      ? Math.min(...filteredNodes.map((n) => n.hourlyRateUsd))
      : 0.0;
    const highestScore = filteredNodes.length > 0
      ? Math.max(...filteredNodes.map((n) => n.benchmarkScore))
      : 0;

    const response: MarketplaceListResponse = {
      nodes: filteredNodes,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
      stats: {
        totalOnlineGpus,
        totalVramGb,
        lowestHourlyRateUsd: lowestRate,
        highestBenchmarkScore: highestScore,
      },
    };

    this.cachedList.set(cacheKey, {
      data: response,
      expiresAt: Date.now() + 2000, // 2-second short TTL cache
    });

    return response;
  }

  async getNodeDetails(nodeId: string): Promise<ComputeNode> {
    const node = await this.prisma.computeNode.findUnique({
      where: { id: nodeId },
    });

    if (!node) {
      throw new NotFoundException(`Compute node ${nodeId} not found`);
    }

    const redisClient = this.redis.getClient();
    const redisHealthy = await this.redis.isHealthy();
    let isOnline = true;
    let telemetry: TelemetryMetrics | undefined;

    if (redisClient && redisHealthy) {
      const lease = await redisClient.get(`node:heartbeat:${node.id}`);
      isOnline = !!lease;
      const rawTelemetry = await redisClient.get(`node:telemetry:${node.id}`);
      if (rawTelemetry) {
        try {
          telemetry = JSON.parse(rawTelemetry);
        } catch {}
      }
    }

    const tier = node.vramGb >= 80
      ? ComputeTier.TIER_1_ENTERPRISE_GPU
      : node.vramGb >= 24
      ? ComputeTier.TIER_2_PRO_GPU
      : node.vramGb > 0
      ? ComputeTier.TIER_3_CONSUMER_GPU
      : ComputeTier.TIER_4_CPU_ONLY;

    return {
      id: node.id,
      providerId: node.providerId,
      name: node.name,
      status: isOnline ? (node.status as NodeStatus) : NodeStatus.OFFLINE,
      cpu: {
        model: node.cpuModel,
        cores: node.cpuCores,
        threads: node.cpuCores * 2,
      },
      gpus: node.gpuModel
        ? [
            {
              model: node.gpuModel,
              vendor: 'NVIDIA',
              vramGb: node.vramGb,
              count: node.gpuCount,
            },
          ]
        : [],
      ramGb: node.ramGb,
      diskGb: node.diskGb,
      hourlyRateUsd: Number(node.hourlyRateUsd),
      benchmarkScore: node.benchmarkScore,
      computeTier: tier,
      verificationStatus: HardwareVerificationStatus.VERIFIED,
      reliabilityScore: 99.8,
      lastHeartbeat: node.lastHeartbeat.toISOString(),
      latestTelemetry: telemetry,
      createdAt: node.createdAt.toISOString(),
    };
  }

  async getMarketplaceSummary(): Promise<MarketplaceSummary> {
    if (this.cachedSummary && Date.now() < this.cachedSummary.expiresAt) {
      return this.cachedSummary.data;
    }

    const allNodes = await this.prisma.computeNode.findMany();
    const redisClient = this.redis.getClient();
    const redisHealthy = await this.redis.isHealthy();

    let onlineCount = 0;
    let totalGpus = 0;
    let totalVram = 0;
    let minRate = 999999;

    for (const n of allNodes) {
      let isOnline = true;
      if (redisClient && redisHealthy) {
        const lease = await redisClient.get(`node:heartbeat:${n.id}`);
        isOnline = !!lease;
      }
      if (isOnline) {
        onlineCount++;
        totalGpus += n.gpuCount;
        totalVram += n.vramGb * (n.gpuCount || 1);
        if (Number(n.hourlyRateUsd) < minRate) {
          minRate = Number(n.hourlyRateUsd);
        }
      }
    }

    const summary: MarketplaceSummary = {
      totalNodesOnline: onlineCount,
      totalGpuCount: totalGpus,
      totalVramGb: totalVram,
      lowestPriceUsdPerHour: minRate < 999999 ? minRate : 0.20,
      averageReliabilityPercent: 99.8,
      activeWorkloadsCount: 0,
    };

    this.cachedSummary = {
      data: summary,
      expiresAt: Date.now() + 3000, // 3-second cache TTL
    };

    return summary;
  }
}
