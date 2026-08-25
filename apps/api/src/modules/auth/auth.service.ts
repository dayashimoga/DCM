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
import { PrismaService } from '../prisma/prisma.service';
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
  ) {}

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

  async refreshTokens(refreshToken: string): Promise<AuthTokens> {
    try {
      const refreshSecret = this.configService.get<string>('jwt.refreshSecret') || 'dev-super-secure-jwt-refresh-secret-key-32-chars';
      const payload = this.jwtService.verify(refreshToken, {
        secret: refreshSecret,
      });

      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
      });

      if (!user) {
        throw new UnauthorizedException('Invalid refresh token session');
      }

      return this.generateTokens(user.id, user.email, user.role as unknown as UserRole);
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
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
    const payload = { sub: userId, email, role };

    const accessSecret = this.configService.get<string>('jwt.secret') || 'dev-super-secure-jwt-secret-key-32-chars-minimum';
    const refreshSecret = this.configService.get<string>('jwt.refreshSecret') || 'dev-super-secure-jwt-refresh-secret-key-32-chars';

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: accessSecret,
        expiresIn: '1h',
      }),
      this.jwtService.signAsync(payload, {
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
}
