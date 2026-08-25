import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MetricsService } from '../src/modules/metrics/metrics.service';
import { PrismaService } from '../src/modules/prisma/prisma.service';
import { RedisService } from '../src/modules/redis/redis.service';

describe('MetricsService Unit Tests', () => {
  let service: MetricsService;
  let mockPrisma: any;
  let mockRedis: any;

  beforeEach(() => {
    mockPrisma = {
      computeNode: {
        count: vi.fn().mockResolvedValue(5),
        findMany: vi.fn().mockResolvedValue([{ gpuCount: 2 }, { gpuCount: 4 }]),
      },
      job: {
        count: vi.fn().mockResolvedValue(3),
      },
    };

    mockRedis = {
      getClient: vi.fn().mockReturnValue(null),
      isHealthy: vi.fn().mockResolvedValue(true),
    };

    service = new MetricsService(mockPrisma as PrismaService, mockRedis as RedisService);
  });

  describe('getPlatformMetrics()', () => {
    it('should return RED metrics and platform counts', async () => {
      const metrics = await service.getPlatformMetrics();
      expect(metrics.length).toBeGreaterThan(3);

      const nodeMetric = metrics.find((m) => m.name === 'compute_marketplace_nodes_online_gauge');
      expect(nodeMetric).toBeDefined();
      expect(nodeMetric?.value).toBe(5);

      const gpuMetric = metrics.find((m) => m.name === 'compute_marketplace_gpus_available_gauge');
      expect(gpuMetric).toBeDefined();
      expect(gpuMetric?.value).toBe(6);
    });
  });

  describe('getPrometheusExposition()', () => {
    it('should format metrics in Prometheus standard text exposition format', async () => {
      const text = await service.getPrometheusExposition();
      expect(text).toContain('# HELP compute_marketplace_');
      expect(text).toContain('# TYPE compute_marketplace_');
      expect(text).toContain('compute_marketplace_http_requests_total');
    });
  });

  describe('recordTraceSpan() & getObservabilitySummary()', () => {
    it('should buffer trace spans and return summary with latency and error rates', async () => {
      service.recordTraceSpan({
        traceId: 'trc-test-1',
        spanId: 'spn-1',
        name: 'GET /api/v1/health',
        serviceName: 'marketplace-api',
        durationMs: 12,
        status: 'OK',
        timestamp: new Date().toISOString(),
      });

      const summary = await service.getObservabilitySummary();
      expect(summary.totalMetricsExported).toBeGreaterThan(0);
      expect(summary.activeTracesSampled).toBeGreaterThan(0);
      expect(summary.averageLatencyMs).toBeGreaterThan(0);
    });
  });
});
