import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DistributedComputeClient } from '../src/index';

describe('DistributedComputeClient SDK Unit Tests', () => {
  let client: DistributedComputeClient;

  beforeEach(() => {
    client = new DistributedComputeClient({
      apiKey: 'dc_live_testkey123',
      baseUrl: 'http://localhost:4000/api/v1',
    });
  });

  it('should initialize sub-clients properly', () => {
    expect(client.nodes).toBeDefined();
    expect(client.workloads).toBeDefined();
    expect(client.billing).toBeDefined();
    expect(client.reputation).toBeDefined();
  });

  it('should format request headers with Bearer token and x-api-key', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ nodes: [], total: 0 }),
    });
    global.fetch = mockFetch;

    await client.nodes.list();

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [url, opts] = mockFetch.mock.calls[0];
    expect(url).toBe('http://localhost:4000/api/v1/marketplace/nodes');
    expect(opts.headers['Authorization']).toBe('Bearer dc_live_testkey123');
    expect(opts.headers['x-api-key']).toBe('dc_live_testkey123');
  });

  it('should submit workload via workloads.submit()', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ id: 'job-123', status: 'PENDING' }),
    });
    global.fetch = mockFetch;

    const job = await client.workloads.submit({
      image: 'pytorch/pytorch:2.1.0-cuda12.1-cudnn8-runtime',
      command: 'python train.py',
    });

    expect(job.id).toBe('job-123');
    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [url, opts] = mockFetch.mock.calls[0];
    expect(url).toBe('http://localhost:4000/api/v1/workloads/jobs');
    expect(opts.method).toBe('POST');
  });
});
