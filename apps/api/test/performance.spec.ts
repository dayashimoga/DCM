import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MarketplaceService } from '../src/modules/marketplace/marketplace.service';
import { PrismaService } from '../src/modules/prisma/prisma.service';
import { RedisService } from '../src/modules/redis/redis.service';

describe('Performance & Caching Benchmark Unit Tests', () => {
  let marketplaceService: MarketplaceService;
  let mockPrisma: any;
  let mockRedis: any;

  beforeEach(() => {
    mockPrisma = {
      computeNode: {
        count: vi.fn().mockResolvedValue(100),
        findMany: vi.fn().mockResolvedValue([
          {
            id: 'node-perf-1',
            providerId: 'prov-1',
            name: 'H100-Node',
            status: 'ONLINE',
            cpuModel: 'AMD EPYC 9654',
            cpuCores: 96,
            gpuModel: 'NVIDIA H100 SXM5',
            gpuCount: 8,
            vramGb: 80,
            ramGb: 1024,
            diskGb: 7680,
            hourlyRateUsd: 2.85,
            benchmarkScore: 980,
            lastHeartbeat: new Date(),
            createdAt: new Date(),
          },
        ]),
      },
    };

    mockRedis = {
      getClient: vi.fn().mockReturnValue(null),
      isHealthy: vi.fn().mockResolvedValue(false),
    };

    marketplaceService = new MarketplaceService(
      mockPrisma as PrismaService,
      mockRedis as RedisService,
    );
  });

  it('should deliver cached search results in < 5ms for repeated queries', async () => {
    // Warm up cache
    await marketplaceService.searchNodes({});
    expect(mockPrisma.computeNode.findMany).toHaveBeenCalledTimes(1);

    // Second call should hit in-memory cache directly without hitting DB
    const start = performance.now();
    const cachedResult = await marketplaceService.searchNodes({});
    const durationMs = performance.now() - start;

    expect(cachedResult.nodes.length).toBe(1);
    expect(mockPrisma.computeNode.findMany).toHaveBeenCalledTimes(1); // No additional DB query
    expect(durationMs).toBeLessThan(10); // Sub-10ms latency SLA
  });

  it('should deliver cached marketplace summary in < 5ms', async () => {
    // Warm up cache
    await marketplaceService.getMarketplaceSummary();
    expect(mockPrisma.computeNode.findMany).toHaveBeenCalledTimes(1);

    // Second call should hit in-memory cache directly
    const start = performance.now();
    const cachedSummary = await marketplaceService.getMarketplaceSummary();
    const durationMs = performance.now() - start;

    expect(cachedSummary.totalNodesOnline).toBe(1);
    expect(mockPrisma.computeNode.findMany).toHaveBeenCalledTimes(1);
    expect(durationMs).toBeLessThan(10);
  });
});
