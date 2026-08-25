import { describe, it, expect, vi, beforeEach } from 'vitest';
import { HealthService } from '../src/modules/health/health.service';
import { HealthController } from '../src/modules/health/health.controller';
import { PrismaService } from '../src/modules/prisma/prisma.service';
import { RedisService } from '../src/modules/redis/redis.service';

describe('Health Module Unit Tests', () => {
  let healthService: HealthService;
  let healthController: HealthController;
  let mockPrisma: Partial<PrismaService>;
  let mockRedis: Partial<RedisService>;

  beforeEach(() => {
    mockPrisma = {
      isHealthy: vi.fn().mockResolvedValue(true),
    };
    mockRedis = {
      isHealthy: vi.fn().mockResolvedValue(true),
    };
    healthService = new HealthService(
      mockPrisma as PrismaService,
      mockRedis as RedisService,
    );
    healthController = new HealthController(healthService);
  });

  it('should return status "ok" when both Database and Redis are healthy', async () => {
    const result = await healthController.getHealth();
    expect(result.status).toBe('ok');
    expect(result.services.database).toBe('connected');
    expect(result.services.redis).toBe('connected');
    expect(result.services.scheduler).toBe('active');
    expect(result.version).toBe('0.1.0');
    expect(typeof result.uptimeSeconds).toBe('number');
  });

  it('should return status "degraded" when Database is healthy but Redis is disconnected', async () => {
    mockRedis.isHealthy = vi.fn().mockResolvedValue(false);
    const result = await healthController.getHealth();
    expect(result.status).toBe('degraded');
    expect(result.services.database).toBe('connected');
    expect(result.services.redis).toBe('disconnected');
  });

  it('should return status "error" when both services are disconnected', async () => {
    mockPrisma.isHealthy = vi.fn().mockResolvedValue(false);
    mockRedis.isHealthy = vi.fn().mockResolvedValue(false);
    const result = await healthController.getHealth();
    expect(result.status).toBe('error');
    expect(result.services.database).toBe('disconnected');
    expect(result.services.redis).toBe('disconnected');
  });
});
