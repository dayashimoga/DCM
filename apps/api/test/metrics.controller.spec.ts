import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MetricsController } from '../src/modules/metrics/metrics.controller';
import { MetricsService } from '../src/modules/metrics/metrics.service';
import { MetricType } from '@distributed-compute/shared-types';

describe('MetricsController Unit Tests', () => {
  let controller: MetricsController;
  let mockService: Partial<MetricsService>;

  beforeEach(() => {
    mockService = {
      getPrometheusExposition: vi.fn().mockResolvedValue('# HELP test\ntest_metric 42\n'),
      getPlatformMetrics: vi.fn().mockResolvedValue([
        {
          name: 'test_metric',
          type: MetricType.GAUGE,
          value: 42,
          description: 'test metric',
        },
      ]),
      getObservabilitySummary: vi.fn().mockResolvedValue({
        totalMetricsExported: 6,
        activeTracesSampled: 4,
        averageLatencyMs: 25,
        errorRatePercent: 0.01,
        requestsPerSecond: 100,
        metrics: [],
        recentTraces: [],
      }),
    };

    controller = new MetricsController(mockService as MetricsService);
  });

  it('should return raw prometheus exposition text', async () => {
    const mockRes = {
      send: vi.fn(),
    } as any;

    await controller.getPrometheusMetrics(mockRes);
    expect(mockRes.send).toHaveBeenCalledWith(expect.stringContaining('test_metric 42'));
  });

  it('should return JSON metrics', async () => {
    const metrics = await controller.getJsonMetrics();
    expect(metrics[0].name).toBe('test_metric');
    expect(metrics[0].value).toBe(42);
  });

  it('should return observability summary', async () => {
    const summary = await controller.getObservabilitySummary();
    expect(summary.requestsPerSecond).toBe(100);
    expect(summary.averageLatencyMs).toBe(25);
  });
});
