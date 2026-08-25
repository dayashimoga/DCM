import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { HealthCheckResponse } from '@distributed-compute/shared-types';

@Injectable()
export class HealthService {
  private readonly startTime = Date.now();

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  async checkHealth(): Promise<HealthCheckResponse> {
    const dbHealthy = await this.prisma.isHealthy();
    const redisHealthy = await this.redis.isHealthy();

    const isAllHealthy = dbHealthy && redisHealthy;
    const isDegraded = dbHealthy || redisHealthy;

    return {
      status: isAllHealthy ? 'ok' : isDegraded ? 'degraded' : 'error',
      timestamp: new Date().toISOString(),
      version: '0.1.0',
      uptimeSeconds: Math.floor((Date.now() - this.startTime) / 1000),
      services: {
        database: dbHealthy ? 'connected' : 'disconnected',
        redis: redisHealthy ? 'connected' : 'disconnected',
        scheduler: 'active',
      },
    };
  }
}
