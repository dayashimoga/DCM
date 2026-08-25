import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ApiKeyService } from '../src/modules/api-key/api-key.service';
import { RedisService } from '../src/modules/redis/redis.service';
import { ApiKeyScope } from '@distributed-compute/shared-types';

describe('ApiKeyService Unit Tests', () => {
  let service: ApiKeyService;
  let mockRedis: any;

  beforeEach(() => {
    mockRedis = {
      getClient: vi.fn().mockReturnValue({
        set: vi.fn().mockResolvedValue('OK'),
        del: vi.fn().mockResolvedValue(1),
      }),
      isHealthy: vi.fn().mockResolvedValue(true),
    };

    service = new ApiKeyService(mockRedis as RedisService);
  });

  describe('createApiKey()', () => {
    it('should generate a dc_live_ secret and return masked prefix', async () => {
      const res = await service.createApiKey('user-123', {
        name: 'Training Key',
        scopes: [ApiKeyScope.WORKLOADS_ALL],
      });

      expect(res.rawSecretKey).toMatch(/^dc_live_[a-f0-9]{48}$/);
      expect(res.apiKey.id).toBeDefined();
      expect(res.apiKey.name).toBe('Training Key');
      expect(res.apiKey.keyPrefix).toMatch(/^dc_live_[a-f0-9]{4}\.\.\.[a-f0-9]{4}$/);
      expect(res.apiKey.scopes).toContain(ApiKeyScope.WORKLOADS_ALL);
    });
  });

  describe('listApiKeys() & revokeApiKey()', () => {
    it('should list and allow revoking an existing key', async () => {
      const created = await service.createApiKey('user-123', {
        name: 'Temporary Key',
      });

      const listBefore = await service.listApiKeys('user-123');
      expect(listBefore.some((k) => k.id === created.apiKey.id)).toBe(true);

      const revoked = await service.revokeApiKey('user-123', created.apiKey.id);
      expect(revoked).toBe(true);

      const listAfter = await service.listApiKeys('user-123');
      expect(listAfter.some((k) => k.id === created.apiKey.id)).toBe(false);
    });
  });
});
