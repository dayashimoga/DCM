import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SecurityController } from '../src/modules/security/security.controller';
import { SecurityService } from '../src/modules/security/security.service';
import {
  SecurityEventType,
  SecuritySeverity,
  SandboxRuntime,
  NetworkIsolationMode,
} from '@distributed-compute/shared-types';

describe('SecurityController Unit Tests', () => {
  let controller: SecurityController;
  let mockService: Partial<SecurityService>;

  beforeEach(() => {
    mockService = {
      getAuditSummary: vi.fn().mockResolvedValue({
        totalEventsLogged: 5,
        criticalThreatsBlocked: 2,
        activeSandboxesHardened: 8,
        systemComplianceScorePercent: 99.8,
        policy: {
          runtime: SandboxRuntime.GVISOR_RUNSC,
          dropCapabilities: ['ALL'],
          readOnlyRootfs: true,
          noNewPrivileges: true,
          runAsUser: '10001:10001',
          seccompProfile: 'default.json',
          networkMode: NetworkIsolationMode.ISOLATED_NONE,
          memoryLimitMb: 8192,
          cpuQuotaPercent: 400,
          pidsLimit: 1024,
          tmpfsMounts: ['/tmp'],
        },
        recentSecurityEvents: [],
      }),
      getBaselinePolicy: vi.fn().mockReturnValue({
        runtime: SandboxRuntime.GVISOR_RUNSC,
        dropCapabilities: ['ALL'],
        readOnlyRootfs: true,
        noNewPrivileges: true,
        runAsUser: '10001:10001',
        seccompProfile: 'default.json',
        networkMode: NetworkIsolationMode.ISOLATED_NONE,
        memoryLimitMb: 8192,
        cpuQuotaPercent: 400,
        pidsLimit: 1024,
        tmpfsMounts: ['/tmp'],
      }),
      reportSecurityEvent: vi.fn().mockResolvedValue({
        id: 'sec-101',
        type: SecurityEventType.MALICIOUS_IMAGE_BLOCKED,
        severity: SecuritySeverity.HIGH,
        source: 'PROVIDER_SANDBOX',
        targetId: 'job-101',
        details: {},
        mitigation: 'Blocked',
        timestamp: new Date().toISOString(),
      }),
    };

    controller = new SecurityController(mockService as SecurityService);
  });

  it('should delegate getAuditSummary call', async () => {
    const res = await controller.getAuditSummary();
    expect(res.systemComplianceScorePercent).toBe(99.8);
  });

  it('should delegate getBaselinePolicy call', () => {
    const res = controller.getBaselinePolicy();
    expect(res.runtime).toBe(SandboxRuntime.GVISOR_RUNSC);
  });

  it('should delegate reportSecurityEvent call', async () => {
    const dto = {
      type: SecurityEventType.MALICIOUS_IMAGE_BLOCKED,
      severity: SecuritySeverity.HIGH,
      source: 'PROVIDER_SANDBOX' as const,
      targetId: 'job-101',
    };
    const res = await controller.reportSecurityEvent(dto);
    expect(res.type).toBe(SecurityEventType.MALICIOUS_IMAGE_BLOCKED);
  });
});
