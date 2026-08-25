import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RolesGuard } from '../src/modules/auth/guards/roles.guard';
import { Reflector } from '@nestjs/core';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { UserRole } from '@distributed-compute/shared-types';

describe('RolesGuard Unit Tests', () => {
  let guard: RolesGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new RolesGuard(reflector);
  });

  function createMockContext(userRole?: UserRole): ExecutionContext {
    return {
      getHandler: () => {},
      getClass: () => {},
      switchToHttp: () => ({
        getRequest: () => ({
          user: userRole ? { id: 'usr-1', role: userRole } : null,
        }),
      }),
    } as unknown as ExecutionContext;
  }

  it('should allow access if no roles are required on the endpoint', () => {
    vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue(null);
    const ctx = createMockContext(UserRole.CUSTOMER);
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('should allow access if user has the exact required role', () => {
    vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue([UserRole.PROVIDER]);
    const ctx = createMockContext(UserRole.PROVIDER);
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('should always allow access for ADMIN role', () => {
    vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue([UserRole.PROVIDER]);
    const ctx = createMockContext(UserRole.ADMIN);
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('should throw ForbiddenException if user lacks the required role', () => {
    vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue([UserRole.PROVIDER]);
    const ctx = createMockContext(UserRole.CUSTOMER);
    expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
  });

  it('should throw ForbiddenException if request has no authenticated user', () => {
    vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue([UserRole.CUSTOMER]);
    const ctx = createMockContext(undefined);
    expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
  });
});
