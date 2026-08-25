import {
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import * as crypto from 'crypto';
import { RedisService } from '../redis/redis.service';
import { CreateApiKeyDto } from './dto/create-api-key.dto';
import {
  ApiKey,
  ApiKeyScope,
  CreateApiKeyResponse,
} from '@distributed-compute/shared-types';

interface StoredApiKey extends ApiKey {
  hashedSecret: string;
}

@Injectable()
export class ApiKeyService {
  private readonly logger = new Logger(ApiKeyService.name);
  private keys: StoredApiKey[] = [];

  constructor(private readonly redis: RedisService) {
    this.seedInitialKeys();
  }

  private seedInitialKeys() {
    const rawSecret = 'dc_live_7fa930bc12984efc9812401823901238';
    const hashed = crypto.createHash('sha256').update(rawSecret).digest('hex');

    this.keys.push({
      id: 'key-init-01',
      userId: 'user-cust-default',
      name: 'Default CI/CD Training Key',
      keyPrefix: 'dc_live_7fa9...1238',
      hashedSecret: hashed,
      scopes: [ApiKeyScope.WORKLOADS_ALL, ApiKeyScope.NODES_READ, ApiKeyScope.BILLING_READ],
      lastUsedAt: new Date(Date.now() - 3600000).toISOString(),
      createdAt: new Date(Date.now() - 604800000).toISOString(),
    });
  }

  async createApiKey(userId: string, dto: CreateApiKeyDto): Promise<CreateApiKeyResponse> {
    const rawEntropy = crypto.randomBytes(24).toString('hex');
    const rawSecretKey = `dc_live_${rawEntropy}`;
    const hashedSecret = crypto.createHash('sha256').update(rawSecretKey).digest('hex');
    const prefix = `dc_live_${rawEntropy.substring(0, 4)}...${rawEntropy.substring(rawEntropy.length - 4)}`;

    const scopes = dto.scopes && dto.scopes.length > 0 ? dto.scopes : [ApiKeyScope.WORKLOADS_ALL, ApiKeyScope.NODES_READ];

    const apiKey: StoredApiKey = {
      id: `key-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      userId,
      name: dto.name,
      keyPrefix: prefix,
      hashedSecret,
      scopes,
      createdAt: new Date().toISOString(),
    };

    this.keys.unshift(apiKey);

    const redisClient = this.redis.getClient();
    const redisHealthy = await this.redis.isHealthy();
    if (redisClient && redisHealthy) {
      await redisClient.set(`apikey:${hashedSecret}`, JSON.stringify(apiKey));
    }

    this.logger.log(`[API KEY] Created new API key '${dto.name}' (${prefix}) for user ${userId}`);

    const { hashedSecret: _, ...publicApiKey } = apiKey;
    return {
      apiKey: publicApiKey,
      rawSecretKey,
    };
  }

  async listApiKeys(userId: string): Promise<ApiKey[]> {
    return this.keys
      .filter((k) => k.userId === userId || userId === 'all')
      .map(({ hashedSecret, ...publicObj }) => publicObj);
  }

  async revokeApiKey(userId: string, keyId: string): Promise<boolean> {
    const index = this.keys.findIndex((k) => k.id === keyId && (k.userId === userId || userId === 'all'));
    if (index === -1) {
      throw new NotFoundException(`API key ${keyId} not found`);
    }

    const removed = this.keys.splice(index, 1)[0];
    const redisClient = this.redis.getClient();
    const redisHealthy = await this.redis.isHealthy();
    if (redisClient && redisHealthy) {
      await redisClient.del(`apikey:${removed.hashedSecret}`);
    }

    this.logger.log(`[API KEY] Revoked API key ${keyId} for user ${userId}`);
    return true;
  }

  async validateApiKey(rawSecretKey: string): Promise<ApiKey | null> {
    const hashedSecret = crypto.createHash('sha256').update(rawSecretKey).digest('hex');
    const redisClient = this.redis.getClient();
    const redisHealthy = await this.redis.isHealthy();
    if (redisClient && redisHealthy) {
      const cached = await redisClient.get(`apikey:${hashedSecret}`);
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          const { hashedSecret: _, ...publicApiKey } = parsed;
          return publicApiKey;
        } catch {}
      }
    }

    const key = this.keys.find((k) => k.hashedSecret === hashedSecret);
    if (!key) return null;
    const { hashedSecret: _, ...publicApiKey } = key;
    return publicApiKey;
  }
}
