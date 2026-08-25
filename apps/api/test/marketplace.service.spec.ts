import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MarketplaceService } from '../src/modules/marketplace/marketplace.service';
import { PrismaService } from '../src/modules/prisma/prisma.service';
import { RedisService } from '../src/modules/redis/redis.service';
import { ComputeTier, SortByOption } from '@distributed-compute/shared-types';
import { NotFoundException } from '@nestjs/common';

describe('MarketplaceService Unit Tests', () => {
  let service: MarketplaceService;
  let mockPrisma: any;
  let mockRedis: any;

  beforeEach(() => {
    mockPrisma = {
      computeNode: {
        count: vi.fn(),
        findMany: vi.fn(),
        findUnique: vi.fn(),
      },
    };

    mockRedis = {
      getClient: vi.fn().mockReturnValue(null),
      isHealthy: vi.fn().mockResolvedValue(false),
    };

    service = new MarketplaceService(
      mockPrisma as PrismaService,
      mockRedis as RedisService,
    );
  });

  describe('searchNodes()', () => {
    it('should search compute nodes with filters and pagination', async () => {
      mockPrisma.computeNode.count.mockResolvedValue(2);
      mockPrisma.computeNode.findMany.mockResolvedValue([
        {
          id: 'node-1',
          providerId: 'prov-1',
          name: 'H100-Rack-A',
          status: 'ONLINE',
          cpuModel: 'AMD EPYC 9654',
          cpuCores: 96,
          gpuModel: 'NVIDIA H100 80GB HBM3',
          gpuCount: 8,
          vramGb: 80,
          ramGb: 512,
          diskGb: 4000,
          hourlyRateUsd: 19.5,
          benchmarkScore: 990,
          lastHeartbeat: new Date(),
          createdAt: new Date(),
        },
        {
          id: 'node-2',
          providerId: 'prov-2',
          name: 'RTX4090-Rig',
          status: 'ONLINE',
          cpuModel: 'AMD Ryzen 9',
          cpuCores: 16,
          gpuModel: 'NVIDIA GeForce RTX 4090',
          gpuCount: 2,
          vramGb: 24,
          ramGb: 64,
          diskGb: 2000,
          hourlyRateUsd: 1.4,
          benchmarkScore: 820,
          lastHeartbeat: new Date(),
          createdAt: new Date(),
        },
      ]);

      const result = await service.searchNodes({
        searchQuery: 'H100',
        minVramGb: 24,
        sortBy: SortByOption.PRICE_ASC,
        page: 1,
        limit: 10,
      });

      expect(result.nodes.length).toBe(2);
      expect(result.total).toBe(2);
      expect(result.stats.lowestHourlyRateUsd).toBe(1.4);
      expect(result.stats.highestBenchmarkScore).toBe(990);
    });

    it('should filter by compute tier', async () => {
      mockPrisma.computeNode.count.mockResolvedValue(1);
      mockPrisma.computeNode.findMany.mockResolvedValue([
        {
          id: 'node-1',
          providerId: 'prov-1',
          name: 'H100-Rack-A',
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

      const result = await service.searchNodes({
        tier: ComputeTier.TIER_1_ENTERPRISE_GPU,
      });

      expect(result.nodes.length).toBe(1);
      expect(result.nodes[0].computeTier).toBe(ComputeTier.TIER_1_ENTERPRISE_GPU);
    });
  });

  describe('getNodeDetails()', () => {
    it('should return node details if node exists', async () => {
      mockPrisma.computeNode.findUnique.mockResolvedValue({
        id: 'node-1',
        providerId: 'prov-1',
        name: 'H100-Dedicated',
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
      });

      const node = await service.getNodeDetails('node-1');
      expect(node.id).toBe('node-1');
      expect(node.computeTier).toBe(ComputeTier.TIER_1_ENTERPRISE_GPU);
    });

    it('should throw NotFoundException if node does not exist', async () => {
      mockPrisma.computeNode.findUnique.mockResolvedValue(null);
      await expect(service.getNodeDetails('non-existent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('getMarketplaceSummary()', () => {
    it('should return aggregated network summary', async () => {
      mockPrisma.computeNode.findMany.mockResolvedValue([
        {
          id: 'node-1',
          status: 'ONLINE',
          gpuCount: 8,
          vramGb: 80,
          hourlyRateUsd: 19.5,
        },
        {
          id: 'node-2',
          status: 'ONLINE',
          gpuCount: 2,
          vramGb: 24,
          hourlyRateUsd: 1.4,
        },
      ]);

      const summary = await service.getMarketplaceSummary();
      expect(summary.totalNodesOnline).toBe(2);
      expect(summary.totalGpuCount).toBe(10);
      expect(summary.totalVramGb).toBe(688); // 80*8 + 24*2 = 640 + 48 = 688
      expect(summary.lowestPriceUsdPerHour).toBe(1.4);
    });
  });
});
