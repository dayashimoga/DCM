import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthController } from '../src/modules/auth/auth.controller';
import { AuthService } from '../src/modules/auth/auth.service';
import { UserRole } from '@distributed-compute/shared-types';

describe('AuthController Unit Tests', () => {
  let controller: AuthController;
  let mockAuthService: Partial<AuthService>;

  beforeEach(() => {
    mockAuthService = {
      register: vi.fn().mockResolvedValue({
        user: { id: 'usr-1', email: 'test@example.com', role: UserRole.CUSTOMER, balanceUsd: 0, createdAt: '' },
        tokens: { accessToken: 'acc-tok', refreshToken: 'ref-tok', expiresIn: 3600 },
      }),
      login: vi.fn().mockResolvedValue({
        user: { id: 'usr-1', email: 'test@example.com', role: UserRole.CUSTOMER, balanceUsd: 0, createdAt: '' },
        tokens: { accessToken: 'acc-tok', refreshToken: 'ref-tok', expiresIn: 3600 },
      }),
      refreshTokens: vi.fn().mockResolvedValue({
        accessToken: 'new-acc-tok',
        refreshToken: 'new-ref-tok',
        expiresIn: 3600,
      }),
      getProfile: vi.fn().mockResolvedValue({
        id: 'usr-1',
        email: 'test@example.com',
        role: UserRole.CUSTOMER,
        balanceUsd: 25.0,
        createdAt: '',
      }),
    };

    controller = new AuthController(mockAuthService as AuthService);
  });

  it('should delegate register call to AuthService', async () => {
    const dto = { email: 'test@example.com', password: 'Password123!', role: UserRole.CUSTOMER };
    const res = await controller.register(dto);
    expect(res.user.email).toBe('test@example.com');
    expect(mockAuthService.register).toHaveBeenCalledWith(dto);
  });

  it('should delegate login call to AuthService', async () => {
    const dto = { email: 'test@example.com', password: 'Password123!' };
    const res = await controller.login(dto);
    expect(res.tokens.accessToken).toBe('acc-tok');
    expect(mockAuthService.login).toHaveBeenCalledWith(dto);
  });

  it('should delegate refresh call to AuthService', async () => {
    const res = await controller.refresh({ refreshToken: 'ref-tok' });
    expect(res.accessToken).toBe('new-acc-tok');
    expect(mockAuthService.refreshTokens).toHaveBeenCalledWith('ref-tok');
  });

  it('should return logout confirmation', async () => {
    const res = await controller.logout();
    expect(res.message).toBe('Successfully logged out');
  });

  it('should return profile for current user', async () => {
    const res = await controller.getMe({
      id: 'usr-1',
      email: 'test@example.com',
      role: UserRole.CUSTOMER,
      balanceUsd: 25,
      createdAt: '',
    });
    expect(res.id).toBe('usr-1');
    expect(mockAuthService.getProfile).toHaveBeenCalledWith('usr-1');
  });
});
