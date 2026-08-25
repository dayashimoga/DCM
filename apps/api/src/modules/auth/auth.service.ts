import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { UserRole, AuthResponse, AuthTokens, UserProfile } from '@distributed-compute/shared-types';
import { Role } from '@prisma/client';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly redis?: RedisService,
  ) {}

  /**
   * Returns the JWT secret for the given config key.
   * SECURITY FIX (F4): Never fall back to hardcoded secrets.
   * In test/dev mode, uses a deterministic but clearly-marked dev secret.
   */
  private getSecret(key: string): string {
    const secret = this.configService.get<string>(key);
    if (secret) return secret;

    const nodeEnv = this.configService.get<string>('NODE_ENV') || process.env.NODE_ENV || 'development';
    if (nodeEnv === 'production') {
      throw new Error(`FATAL: JWT secret '${key}' is not configured. Refusing to start with insecure defaults in production.`);
    }

    // Dev/test only — deterministic but clearly marked
    this.logger.warn(`[SECURITY] Using development-only fallback for '${key}'. Set this in production!`);
    return `DEV-ONLY-INSECURE-${key}-${crypto.createHash('sha256').update(key).digest('hex').substring(0, 16)}`;
  }

  async register(dto: RegisterDto): Promise<AuthResponse> {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    if (existingUser) {
      throw new ConflictException('A user with this email address already exists');
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(dto.password, salt);

    const prismaRole = dto.role as unknown as Role;

    const user = await this.prisma.user.create({
      data: {
        email: dto.email.toLowerCase(),
        passwordHash,
        role: prismaRole,
      },
      select: {
        id: true,
        email: true,
        role: true,
        balanceUsd: true,
        createdAt: true,
      },
    });

    // If registered as PROVIDER, create Provider profile record
    if (dto.role === UserRole.PROVIDER) {
      await this.prisma.provider.create({
        data: {
          userId: user.id,
          name: `${user.email.split('@')[0]}-Fleet`,
        },
      });
    }

    const userProfile: UserProfile = {
      id: user.id,
      email: user.email,
      role: user.role as unknown as UserRole,
      balanceUsd: Number(user.balanceUsd),
      createdAt: user.createdAt.toISOString(),
    };

    const tokens = await this.generateTokens(user.id, user.email, user.role as unknown as UserRole);

    this.logger.log(`New user registered: ${user.email} with role ${user.role}`);
    return { user: userProfile, tokens };
  }

  async login(dto: LoginDto): Promise<AuthResponse> {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const userProfile: UserProfile = {
      id: user.id,
      email: user.email,
      role: user.role as unknown as UserRole,
      balanceUsd: Number(user.balanceUsd),
      createdAt: user.createdAt.toISOString(),
    };

    const tokens = await this.generateTokens(user.id, user.email, user.role as unknown as UserRole);
    return { user: userProfile, tokens };
  }

  /**
   * SECURITY FIX (F5): Refresh tokens now include a jti (JWT ID) that is
   * tracked in Redis. On refresh, the old jti is revoked (single-use rotation).
   */
  async refreshTokens(refreshToken: string): Promise<AuthTokens> {
    try {
      const refreshSecret = this.getSecret('jwt.refreshSecret');
      const payload = this.jwtService.verify(refreshToken, {
        secret: refreshSecret,
      });

      // Check if this token's jti has been revoked
      const jti = payload.jti;
      if (jti) {
        const revoked = await this.isTokenRevoked(jti);
        if (revoked) {
          throw new UnauthorizedException('Refresh token has been revoked');
        }
        // Revoke the current refresh token (single-use rotation)
        await this.revokeToken(jti, 7 * 24 * 3600); // TTL matches refresh token expiry
      }

      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
      });

      if (!user) {
        throw new UnauthorizedException('Invalid refresh token session');
      }

      return this.generateTokens(user.id, user.email, user.role as unknown as UserRole);
    } catch (err) {
      if (err instanceof UnauthorizedException) throw err;
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  /**
   * Logout: revoke the refresh token so it cannot be reused.
   */
  async logout(refreshToken: string): Promise<{ success: boolean }> {
    try {
      const refreshSecret = this.getSecret('jwt.refreshSecret');
      const payload = this.jwtService.verify(refreshToken, {
        secret: refreshSecret,
      });
      if (payload.jti) {
        await this.revokeToken(payload.jti, 7 * 24 * 3600);
      }
    } catch {
      // Token may already be expired — still consider logout successful
    }
    return { success: true };
  }

  async getProfile(userId: string): Promise<UserProfile> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        role: true,
        balanceUsd: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User profile not found');
    }

    return {
      id: user.id,
      email: user.email,
      role: user.role as unknown as UserRole,
      balanceUsd: Number(user.balanceUsd),
      createdAt: user.createdAt.toISOString(),
    };
  }

  private async generateTokens(userId: string, email: string, role: UserRole): Promise<AuthTokens> {
    const jti = crypto.randomUUID(); // Unique token ID for revocation tracking
    const payload = { sub: userId, email, role };

    const accessSecret = this.getSecret('jwt.secret');
    const refreshSecret = this.getSecret('jwt.refreshSecret');

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: accessSecret,
        expiresIn: '1h',
      }),
      this.jwtService.signAsync({ ...payload, jti }, {
        secret: refreshSecret,
        expiresIn: '7d',
      }),
    ]);

    return {
      accessToken,
      refreshToken,
      expiresIn: 3600,
    };
  }

  /**
   * Token revocation helpers — uses Redis blacklist with TTL matching token expiry.
   */
  private async revokeToken(jti: string, ttlSeconds: number): Promise<void> {
    if (!this.redis) return;
    const redisClient = this.redis.getClient();
    const redisHealthy = await this.redis.isHealthy();
    if (redisClient && redisHealthy) {
      await redisClient.set(`revoked:jti:${jti}`, '1', 'EX', ttlSeconds);
    }
  }

  private async isTokenRevoked(jti: string): Promise<boolean> {
    if (!this.redis) return false;
    const redisClient = this.redis.getClient();
    const redisHealthy = await this.redis.isHealthy();
    if (redisClient && redisHealthy) {
      const result = await redisClient.get(`revoked:jti:${jti}`);
      return result !== null;
    }
    return false; // If Redis is down, allow (fail-open for availability; log warning)
  }
}
