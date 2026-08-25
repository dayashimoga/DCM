import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ApiKeyController } from '../src/modules/api-key/api-key.controller';
import { ApiKeyService } from '../src/modules/api-key/api-key.service';
import { ApiKeyScope } from '@distributed-compute/shared-types';

describe('ApiKeyController Unit Tests', () => {
  let controller: ApiKeyController;
  let mockService: Partial<ApiKeyService>;

  beforeEach(() => {
    mockService = {
      createApiKey: vi.fn().mockResolvedValue({
        apiKey: {
          id: 'key-1',
          userId: 'user-1',
          name: 'Test Key',
          keyPrefix: 'dc_live_1234...5678',
          scopes: [ApiKeyScope.WORKLOADS_ALL],
          createdAt: new Date().toISOString(),
        },
        rawSecretKey: 'dc_live_1234567890abcdef1234567890abcdef',
      }),
      listApiKeys: vi.fn().mockResolvedValue([
        {
          id: 'key-1',
          userId: 'user-1',
          name: 'Test Key',
          keyPrefix: 'dc_live_1234...5678',
          scopes: [ApiKeyScope.WORKLOADS_ALL],
          createdAt: new Date().toISOString(),
        },
      ]),
      revokeApiKey: vi.fn().mockResolvedValue(true),
    };

    controller = new ApiKeyController(mockService as ApiKeyService);
  });

  it('should delegate createApiKey call', async () => {
    const res = await controller.createApiKey({ name: 'Test Key' });
    expect(res.rawSecretKey).toBeDefined();
    expect(res.apiKey.name).toBe('Test Key');
  });

  it('should delegate listApiKeys call', async () => {
    const res = await controller.listApiKeys();
    expect(res.length).toBe(1);
    expect(res[0].id).toBe('key-1');
  });

  it('should delegate revokeApiKey call', async () => {
    const res = await controller.revokeApiKey('key-1');
    expect(res.success).toBe(true);
  });
});
