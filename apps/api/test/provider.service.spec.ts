import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ProviderService } from '../src/modules/provider/provider.service';
import { PrismaService } from '../src/modules/prisma/prisma.service';
import { RedisService } from '../src/modules/redis/redis.service';
import { NodeStatus } from '@distributed-compute/shared-types';
import { UnauthorizedException, NotFoundException } from '@nestjs/common';

describe('ProviderService Unit Tests', () => {
  let providerService: ProviderService;
  let mockPrisma: any;
  let mockRedis: any;

  beforeEach(() => {
    mockPrisma = {
      user: {
        findUnique: vi.fn(),
      },
      provider: {
        findFirst: vi.fn(),
        create: vi.fn(),
      },
      computeNode: {
        create: vi.fn(),
        findUnique: vi.fn(),
        findMany: vi.fn(),
        update: vi.fn(),
      },
    };

    mockRedis = {
      getClient: vi.fn().mockReturnValue(null),
      isHealthy: vi.fn().mockReturnValue(false),
    };

    providerService = new ProviderService(
      mockPrisma as PrismaService,
      mockRedis as RedisService,
    );
  });

  describe('generatePairingToken()', () => {
    it('should generate a pairing token for an existing provider', async () => {
      mockPrisma.provider.findFirst.mockResolvedValue({
        id: 'prov-123',
        userId: 'usr-1',
        name: 'Datacenter-Fleet',
      });

      const res = await providerService.generatePairingToken('usr-1');
      expect(res.pairingToken.startsWith('ptk_')).toBe(true);
      expect(res.providerId).toBe('prov-123');
      expect(res.expiresInSeconds).toBe(3600);
      expect(res.quickstartCommand).toContain(res.pairingToken);
    });

    it('should auto-create provider profile if not yet created', async () => {
      mockPrisma.provider.findFirst.mockResolvedValue(null);
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'usr-2',
        email: 'provider2@example.com',
      });
      mockPrisma.provider.create.mockResolvedValue({
        id: 'prov-456',
        userId: 'usr-2',
        name: 'provider2-Fleet',
      });

      const res = await providerService.generatePairingToken('usr-2');
      expect(res.providerId).toBe('prov-456');
    });
  });

  describe('registerNode()', () => {
    it('should register node with valid pairing token', async () => {
      // First generate token so it is saved in memoryTokenStore
      mockPrisma.provider.findFirst.mockResolvedValue({
        id: 'prov-123',
        userId: 'usr-1',
      });
      const tokenRes = await providerService.generatePairingToken('usr-1');

      mockPrisma.computeNode.create.mockResolvedValue({
        id: 'node-999',
        providerId: 'prov-123',
        name: 'H100-Node-test',
        status: 'ONLINE',
      });

      const res = await providerService.registerNode({
        pairingToken: tokenRes.pairingToken,
        hardware: {
          cpu: { model: 'AMD EPYC 9654', cores: 96, threads: 192 },
          gpus: [{ model: 'NVIDIA H100 80GB', vendor: 'NVIDIA', vramGb: 80, count: 1 }],
          memory: { totalRamGb: 256 },
          storage: { totalDiskGb: 2000 },
        },
      });

      expect(res.nodeId).toBe('node-999');
      expect(res.status).toBe(NodeStatus.ONLINE);
      expect(res.heartbeatIntervalSeconds).toBe(15);
    });

    it('should throw UnauthorizedException on invalid or expired token', async () => {
      await expect(
        providerService.registerNode({
          pairingToken: 'invalid_or_expired_token',
          hardware: {
            cpu: { model: 'Generic CPU', cores: 4, threads: 4 },
            gpus: [],
            memory: { totalRamGb: 16 },
            storage: { totalDiskGb: 500 },
          },
        }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('processHeartbeat()', () => {
    it('should acknowledge valid heartbeat and update node', async () => {
      mockPrisma.computeNode.findUnique.mockResolvedValue({
        id: 'node-999',
        status: 'ONLINE',
      });
      mockPrisma.computeNode.update.mockResolvedValue({
        id: 'node-999',
        status: 'ONLINE',
      });

      const res = await providerService.processHeartbeat({
        nodeId: 'node-999',
        status: NodeStatus.ONLINE,
        timestamp: Date.now() / 1000,
        metrics: {
          cpuUsagePercent: 25.5,
          ramUsagePercent: 40.0,
          ramUsedGb: 16.0,
          gpuUtilizationPercent: 80.0,
          gpuTemperatureCelsius: 52.0,
        },
      });

      expect(res.status).toBe('ACK');
      expect(mockPrisma.computeNode.update).toHaveBeenCalled();
    });

    it('should throw NotFoundException if node is not found', async () => {
      mockPrisma.computeNode.findUnique.mockResolvedValue(null);

      await expect(
        providerService.processHeartbeat({
          nodeId: 'unknown-node',
          status: NodeStatus.ONLINE,
          timestamp: Date.now() / 1000,
          metrics: {
            cpuUsagePercent: 0,
            ramUsagePercent: 0,
            ramUsedGb: 0,
            gpuUtilizationPercent: 0,
            gpuTemperatureCelsius: 0,
          },
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getProviderNodes()', () => {
    it('should return list of enriched compute nodes', async () => {
      mockPrisma.provider.findFirst.mockResolvedValue({ id: 'prov-123' });
      mockPrisma.computeNode.findMany.mockResolvedValue([
        {
          id: 'node-1',
          providerId: 'prov-123',
          name: 'H100-US-East',
          status: 'ONLINE',
          cpuModel: 'AMD EPYC',
          cpuCores: 64,
          gpuModel: 'NVIDIA H100',
          gpuCount: 1,
          vramGb: 80,
          ramGb: 256,
          diskGb: 2000,
          hourlyRateUsd: 2.5,
          benchmarkScore: 950,
          lastHeartbeat: new Date(),
          createdAt: new Date(),
        },
      ]);

      const nodes = await providerService.getProviderNodes('usr-1');
      expect(nodes.length).toBe(1);
      expect(nodes[0].name).toBe('H100-US-East');
      expect(nodes[0].hourlyRateUsd).toBe(2.5);
    });
  });
});
