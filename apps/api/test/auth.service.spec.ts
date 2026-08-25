import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthService } from '../src/modules/auth/auth.service';
import { PrismaService } from '../src/modules/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UserRole } from '@distributed-compute/shared-types';
import { ConflictException, UnauthorizedException, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';

describe('AuthService Unit Tests', () => {
  let authService: AuthService;
  let mockPrisma: any;
  let mockJwtService: any;
  let mockConfigService: any;

  beforeEach(() => {
    mockPrisma = {
      user: {
        findUnique: vi.fn(),
        create: vi.fn(),
      },
      provider: {
        create: vi.fn(),
      },
    };

    mockJwtService = {
      signAsync: vi.fn().mockResolvedValue('signed-jwt-token'),
      verify: vi.fn(),
    };

    mockConfigService = {
      get: vi.fn().mockImplementation((key: string) => {
        if (key === 'jwt.secret') return 'test-access-secret';
        if (key === 'jwt.refreshSecret') return 'test-refresh-secret';
        return undefined;
      }),
    };

    authService = new AuthService(
      mockPrisma as PrismaService,
      mockJwtService as JwtService,
      mockConfigService as ConfigService,
    );
  });

  describe('register()', () => {
    it('should successfully register a new customer user', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.user.create.mockResolvedValue({
        id: 'usr-123',
        email: 'customer@example.com',
        role: 'CUSTOMER',
        balanceUsd: 0,
        createdAt: new Date(),
      });

      const result = await authService.register({
        email: 'customer@example.com',
        password: 'Password123!',
        role: UserRole.CUSTOMER,
      });

      expect(result.user.email).toBe('customer@example.com');
      expect(result.user.role).toBe(UserRole.CUSTOMER);
      expect(result.tokens.accessToken).toBe('signed-jwt-token');
      expect(result.tokens.refreshToken).toBe('signed-jwt-token');
      expect(mockPrisma.provider.create).not.toHaveBeenCalled();
    });

    it('should create provider profile when registering as PROVIDER', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.user.create.mockResolvedValue({
        id: 'usr-456',
        email: 'provider@example.com',
        role: 'PROVIDER',
        balanceUsd: 0,
        createdAt: new Date(),
      });

      const result = await authService.register({
        email: 'provider@example.com',
        password: 'Password123!',
        role: UserRole.PROVIDER,
      });

      expect(result.user.role).toBe(UserRole.PROVIDER);
      expect(mockPrisma.provider.create).toHaveBeenCalledWith({
        data: {
          userId: 'usr-456',
          name: 'provider-Fleet',
        },
      });
    });

    it('should throw ConflictException if user already exists', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'existing-id' });

      await expect(
        authService.register({
          email: 'duplicate@example.com',
          password: 'Password123!',
          role: UserRole.CUSTOMER,
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('login()', () => {
    it('should authenticate user with valid credentials', async () => {
      const hashedPassword = await bcrypt.hash('ValidPassword123!', 10);
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'usr-123',
        email: 'user@example.com',
        passwordHash: hashedPassword,
        role: 'CUSTOMER',
        balanceUsd: 50.0,
        createdAt: new Date(),
      });

      const result = await authService.login({
        email: 'user@example.com',
        password: 'ValidPassword123!',
      });

      expect(result.user.id).toBe('usr-123');
      expect(result.tokens.accessToken).toBe('signed-jwt-token');
    });

    it('should throw UnauthorizedException on wrong password', async () => {
      const hashedPassword = await bcrypt.hash('RealPassword123!', 10);
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'usr-123',
        email: 'user@example.com',
        passwordHash: hashedPassword,
        role: 'CUSTOMER',
      });

      await expect(
        authService.login({
          email: 'user@example.com',
          password: 'WrongPassword!',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if email not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(
        authService.login({
          email: 'nonexistent@example.com',
          password: 'Password123!',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('refreshTokens()', () => {
    it('should issue new tokens with valid refresh token', async () => {
      mockJwtService.verify.mockReturnValue({ sub: 'usr-123', email: 'user@example.com', role: 'CUSTOMER' });
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'usr-123',
        email: 'user@example.com',
        role: 'CUSTOMER',
      });

      const result = await authService.refreshTokens('valid-refresh-token');
      expect(result.accessToken).toBe('signed-jwt-token');
      expect(result.refreshToken).toBe('signed-jwt-token');
    });

    it('should throw UnauthorizedException on invalid refresh token', async () => {
      mockJwtService.verify.mockImplementation(() => {
        throw new Error('jwt expired');
      });

      await expect(authService.refreshTokens('invalid-token')).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('getProfile()', () => {
    it('should return user profile if found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'usr-123',
        email: 'user@example.com',
        role: 'CUSTOMER',
        balanceUsd: 100,
        createdAt: new Date(),
      });

      const profile = await authService.getProfile('usr-123');
      expect(profile.id).toBe('usr-123');
      expect(profile.balanceUsd).toBe(100);
    });

    it('should throw NotFoundException if user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      await expect(authService.getProfile('unknown-id')).rejects.toThrow(NotFoundException);
    });
  });
});
