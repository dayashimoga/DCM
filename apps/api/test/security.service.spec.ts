import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SecurityService } from '../src/modules/security/security.service';
import { RedisService } from '../src/modules/redis/redis.service';
import { SecurityEventType, SecuritySeverity, SandboxRuntime } from '@distributed-compute/shared-types';

describe('SecurityService Unit Tests', () => {
  let service: SecurityService;
  let mockRedis: any;

  beforeEach(() => {
    mockRedis = {
      getClient: vi.fn().mockReturnValue({
        lrange: vi.fn().mockResolvedValue([]),
        lpush: vi.fn().mockResolvedValue(1),
        ltrim: vi.fn().mockResolvedValue('OK'),
        incr: vi.fn().mockResolvedValue(1),
        get: vi.fn().mockResolvedValue('2'),
      }),
      isHealthy: vi.fn().mockResolvedValue(true),
    };

    service = new SecurityService(mockRedis as RedisService);
  });

  describe('getBaselinePolicy()', () => {
    it('should return strict defense-in-depth sandbox policy', () => {
      const policy = service.getBaselinePolicy();
      expect(policy.runtime).toBe(SandboxRuntime.GVISOR_RUNSC);
      expect(policy.readOnlyRootfs).toBe(true);
      expect(policy.noNewPrivileges).toBe(true);
      expect(policy.runAsUser).toBe('10001:10001');
      expect(policy.dropCapabilities).toContain('ALL');
    });
  });

  describe('reportSecurityEvent()', () => {
    it('should store and classify security event in audit stream', async () => {
      const event = await service.reportSecurityEvent({
        type: SecurityEventType.RESTRICTED_SYSCALL_BLOCKED,
        severity: SecuritySeverity.CRITICAL,
        source: 'PROVIDER_SANDBOX',
        targetId: 'job-evil-123',
        details: { syscall: 'ptrace' },
        mitigation: 'SIGKILL emitted',
      });

      expect(event.type).toBe(SecurityEventType.RESTRICTED_SYSCALL_BLOCKED);
      expect(event.severity).toBe(SecuritySeverity.CRITICAL);
      expect(event.targetId).toBe('job-evil-123');
    });
  });

  describe('getAuditSummary()', () => {
    it('should return audit summary with compliance score and recent events', async () => {
      const summary = await service.getAuditSummary();
      expect(summary.systemComplianceScorePercent).toBeGreaterThanOrEqual(99.0);
      expect(summary.recentSecurityEvents.length).toBeGreaterThan(0);
      expect(summary.policy.readOnlyRootfs).toBe(true);
    });
  });
});
