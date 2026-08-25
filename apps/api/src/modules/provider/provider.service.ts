import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { RegisterNodeDto } from './dto/register-node.dto';
import { HeartbeatDto } from './dto/heartbeat.dto';
import {
  PairingTokenResponse,
  NodeRegistrationResponse,
  HeartbeatResponse,
  ComputeNode,
  NodeStatus,
  TelemetryMetrics,
} from '@distributed-compute/shared-types';
import * as crypto from 'crypto';

@Injectable()
export class ProviderService {
  private readonly logger = new Logger(ProviderService.name);
  // In-memory fallback map for pairing tokens if Redis is offline during tests/dev
  private readonly memoryTokenStore = new Map<string, { providerId: string; expiresAt: number }>();
  private readonly memoryTelemetryStore = new Map<string, TelemetryMetrics>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  async generatePairingToken(userId: string): Promise<PairingTokenResponse> {
    let provider = await this.prisma.provider.findFirst({
      where: { userId },
    });

    if (!provider) {
      // Auto-provision provider record if user has provider role
      const user = await this.prisma.user.findUnique({ where: { id: userId } });
      if (!user) {
        throw new NotFoundException('User account not found');
      }
      provider = await this.prisma.provider.create({
        data: {
          userId: user.id,
          name: `${user.email.split('@')[0]}-Fleet`,
        },
      });
    }

    const token = `ptk_${crypto.randomBytes(24).toString('hex')}`;
    const ttlSeconds = 3600;

    const redisClient = this.redis.getClient();
    const redisHealthy = await this.redis.isHealthy();
    if (redisClient && redisHealthy) {
      await redisClient.set(`pairing_token:${token}`, provider.id, 'EX', ttlSeconds);
    } else {
      this.memoryTokenStore.set(token, {
        providerId: provider.id,
        expiresAt: Date.now() + ttlSeconds * 1000,
      });
    }

    const quickstartCommand = `podman run -d --name compute-agent --device nvidia.com/gpu=all -e PAIRING_TOKEN=${token} ghcr.io/distributed-compute/agent:latest`;

    this.logger.log(`Generated pairing token for provider ${provider.id}`);
    return {
      pairingToken: token,
      providerId: provider.id,
      expiresInSeconds: ttlSeconds,
      quickstartCommand,
    };
  }

  async registerNode(dto: RegisterNodeDto): Promise<NodeRegistrationResponse> {
    const providerId = await this.resolvePairingToken(dto.pairingToken);
    if (!providerId) {
      throw new UnauthorizedException('Invalid or expired pairing token');
    }

    const hw = dto.hardware;
    const primaryGpu = hw.gpus && hw.gpus.length > 0 ? hw.gpus[0] : null;
    const gpuCount = primaryGpu ? primaryGpu.count || 1 : 0;
    const vramGb = primaryGpu ? primaryGpu.vramGb || 0 : 0;
    const gpuModel = primaryGpu ? primaryGpu.model : 'CPU Only Node';

    // Calculate baseline rate ($/hr) based on hardware specs if not manually set
    let rate = dto.hourlyRateUsd;
    if (!rate || rate <= 0) {
      if (vramGb >= 80) rate = 2.50;
      else if (vramGb >= 24) rate = 1.20;
      else if (gpuCount > 0) rate = 0.60;
      else rate = 0.20;
    }

    const nodeName = dto.nodeName || `${gpuModel.split(' ')[0]}-Node-${crypto.randomBytes(3).toString('hex')}`;

    const node = await this.prisma.computeNode.create({
      data: {
        providerId,
        name: nodeName,
        status: NodeStatus.ONLINE,
        cpuModel: hw.cpu.model || 'Standard Multi-Core CPU',
        cpuCores: hw.cpu.cores || 8,
        gpuModel: primaryGpu ? primaryGpu.model : null,
        gpuCount,
        vramGb,
        ramGb: hw.memory.totalRamGb || 32,
        diskGb: hw.storage.totalDiskGb || 500,
        hourlyRateUsd: rate,
        benchmarkScore: 500, // Baseline before benchmark suite run
      },
    });

    const apiKey = `node_key_${crypto.randomBytes(32).toString('hex')}`;

    // Set initial heartbeat lease in Redis
    const redisClient = this.redis.getClient();
    const redisHealthy = await this.redis.isHealthy();
    if (redisClient && redisHealthy) {
      await redisClient.set(`node:heartbeat:${node.id}`, 'ONLINE', 'EX', 45);
    }

    this.logger.log(`Registered new node: ${node.id} (${node.name}) for provider ${providerId}`);

    return {
      nodeId: node.id,
      status: NodeStatus.ONLINE,
      apiKey,
      heartbeatIntervalSeconds: 15,
    };
  }

  async processHeartbeat(dto: HeartbeatDto): Promise<HeartbeatResponse> {
    const node = await this.prisma.computeNode.findUnique({
      where: { id: dto.nodeId },
    });

    if (!node) {
      throw new NotFoundException('Node not registered');
    }

    // Update node status and last heartbeat timestamp
    await this.prisma.computeNode.update({
      where: { id: dto.nodeId },
      data: {
        lastHeartbeat: new Date(),
        status: dto.status,
      },
    });

    // Store live telemetry in Redis
    const redisClient = this.redis.getClient();
    const redisHealthy = await this.redis.isHealthy();
    if (redisClient && redisHealthy) {
      await redisClient.set(`node:heartbeat:${dto.nodeId}`, dto.status, 'EX', 45);
      await redisClient.set(`node:telemetry:${dto.nodeId}`, JSON.stringify(dto.metrics), 'EX', 60);
    } else {
      this.memoryTelemetryStore.set(dto.nodeId, dto.metrics);
    }

    return {
      status: 'ACK',
      pendingJobId: null,
      timestamp: new Date().toISOString(),
    };
  }

  async getProviderNodes(userId: string): Promise<ComputeNode[]> {
    const provider = await this.prisma.provider.findFirst({
      where: { userId },
    });

    if (!provider) {
      return [];
    }

    const dbNodes = await this.prisma.computeNode.findMany({
      where: { providerId: provider.id },
      orderBy: { createdAt: 'desc' },
    });

    const redisClient = this.redis.getClient();
    const redisHealthy = await this.redis.isHealthy();

    const enrichedNodes: ComputeNode[] = await Promise.all(
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
        } else {
          telemetry = this.memoryTelemetryStore.get(n.id);
          // If heartbeat older than 45s, mark offline
          const ageMs = Date.now() - new Date(n.lastHeartbeat).getTime();
          isOnline = ageMs < 45000;
        }

        const effectiveStatus = isOnline ? (n.status as NodeStatus) : NodeStatus.OFFLINE;

        return {
          id: n.id,
          providerId: n.providerId,
          name: n.name,
          status: effectiveStatus,
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
          reliabilityScore: 99.5,
          lastHeartbeat: n.lastHeartbeat.toISOString(),
          latestTelemetry: telemetry,
          createdAt: n.createdAt.toISOString(),
        };
      }),
    );

    return enrichedNodes;
  }

  private async resolvePairingToken(token: string): Promise<string | null> {
    const redisClient = this.redis.getClient();
    const redisHealthy = await this.redis.isHealthy();
    if (redisClient && redisHealthy) {
      const providerId = await redisClient.get(`pairing_token:${token}`);
      if (providerId) {
        await redisClient.del(`pairing_token:${token}`); // Single use token
        return providerId;
      }
    }

    const memoryEntry = this.memoryTokenStore.get(token);
    if (memoryEntry && memoryEntry.expiresAt > Date.now()) {
      this.memoryTokenStore.delete(token);
      return memoryEntry.providerId;
    }

    return null;
  }
}
