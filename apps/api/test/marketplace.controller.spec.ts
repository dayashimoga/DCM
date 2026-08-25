import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MarketplaceController } from '../src/modules/marketplace/marketplace.controller';
import { MarketplaceService } from '../src/modules/marketplace/marketplace.service';
import { ComputeTier, NodeStatus } from '@distributed-compute/shared-types';

describe('MarketplaceController Unit Tests', () => {
  let controller: MarketplaceController;
  let mockService: Partial<MarketplaceService>;

  beforeEach(() => {
    mockService = {
      searchNodes: vi.fn().mockResolvedValue({
        nodes: [
          {
            id: 'node-1',
            providerId: 'prov-1',
            name: 'H100-US-East',
            status: NodeStatus.ONLINE,
            cpu: { model: 'AMD EPYC', cores: 64, threads: 128 },
            gpus: [{ model: 'NVIDIA H100', vendor: 'NVIDIA', vramGb: 80, count: 8 }],
            ramGb: 512,
            diskGb: 4000,
            hourlyRateUsd: 19.5,
            benchmarkScore: 990,
            computeTier: ComputeTier.TIER_1_ENTERPRISE_GPU,
            reliabilityScore: 99.9,
            lastHeartbeat: '',
            createdAt: '',
          },
        ],
        total: 1,
        page: 1,
        limit: 20,
        totalPages: 1,
        stats: {
          totalOnlineGpus: 8,
          totalVramGb: 640,
          lowestHourlyRateUsd: 19.5,
          highestBenchmarkScore: 990,
        },
      }),
      getNodeDetails: vi.fn().mockResolvedValue({
        id: 'node-1',
        providerId: 'prov-1',
        name: 'H100-US-East',
        status: NodeStatus.ONLINE,
        cpu: { model: 'AMD EPYC', cores: 64, threads: 128 },
        gpus: [{ model: 'NVIDIA H100', vendor: 'NVIDIA', vramGb: 80, count: 8 }],
        ramGb: 512,
        diskGb: 4000,
        hourlyRateUsd: 19.5,
        benchmarkScore: 990,
        computeTier: ComputeTier.TIER_1_ENTERPRISE_GPU,
        reliabilityScore: 99.9,
        lastHeartbeat: '',
        createdAt: '',
      }),
      getMarketplaceSummary: vi.fn().mockResolvedValue({
        totalNodesOnline: 45,
        totalGpuCount: 180,
        totalVramGb: 12400,
        lowestPriceUsdPerHour: 0.25,
        averageReliabilityPercent: 99.8,
        activeWorkloadsCount: 12,
      }),
    };

    controller = new MarketplaceController(mockService as MarketplaceService);
  });

  it('should delegate searchNodes call', async () => {
    const filter = { searchQuery: 'H100', minVramGb: 80 };
    const res = await controller.searchNodes(filter);
    expect(res.nodes.length).toBe(1);
    expect(mockService.searchNodes).toHaveBeenCalledWith(filter);
  });

  it('should delegate getNodeDetails call', async () => {
    const res = await controller.getNodeDetails('node-1');
    expect(res.id).toBe('node-1');
    expect(mockService.getNodeDetails).toHaveBeenCalledWith('node-1');
  });

  it('should delegate getSummary call', async () => {
    const res = await controller.getSummary();
    expect(res.totalNodesOnline).toBe(45);
    expect(mockService.getMarketplaceSummary).toHaveBeenCalled();
  });
});
