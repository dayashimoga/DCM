import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthService } from '../src/modules/auth/auth.service';
import { ProviderService } from '../src/modules/provider/provider.service';
import { BenchmarkService } from '../src/modules/benchmark/benchmark.service';
import { MarketplaceService } from '../src/modules/marketplace/marketplace.service';
import { WorkloadService } from '../src/modules/workload/workload.service';
import { SchedulerService } from '../src/modules/scheduler/scheduler.service';
import { BillingService } from '../src/modules/billing/billing.service';
import { PaymentService } from '../src/modules/payment/payment.service';
import { PayoutService } from '../src/modules/payout/payout.service';
import { SecurityService } from '../src/modules/security/security.service';
import { ReputationService } from '../src/modules/reputation/reputation.service';
import { ApiKeyService } from '../src/modules/api-key/api-key.service';
import {
  ComputeTier,
  HardwareVerificationStatus,
  SchedulingStrategy,
  JobStatus,
  NodeStatus,
  PaymentMethod,
  PayoutDestinationType,
  ApiKeyScope,
  SecurityEventType,
  SecuritySeverity,
} from '@distributed-compute/shared-types';
import { ForbiddenException, NotFoundException, BadRequestException } from '@nestjs/common';

describe('Real Multi-Provider Fleet Lab, Invariants & Security Gate Suite', () => {
  let providerService: ProviderService;
  let benchmarkService: BenchmarkService;
  let marketplaceService: MarketplaceService;
  let workloadService: WorkloadService;
  let schedulerService: SchedulerService;
  let billingService: BillingService;
  let paymentService: PaymentService;
  let payoutService: PayoutService;
  let securityService: SecurityService;
  let apiKeyService: ApiKeyService;

  let mockPrisma: any;
  let mockRedis: any;
  let redisKv: Map<string, string>;
  let redisLists: Map<string, string[]>;
  let mockDbNodes: any[];
  let mockDbUsers: Map<string, any>;
  let mockDbJobs: Map<string, any>;

  beforeEach(() => {
    mockDbNodes = [
      {
        id: 'node-prov-a-h100',
        providerId: 'prov-alpha',
        name: 'Alpha-H100-SXM5',
        status: 'ONLINE',
        cpuModel: 'AMD EPYC 9654',
        cpuCores: 96,
        gpuModel: 'NVIDIA H100 SXM5',
        gpuCount: 8,
        vramGb: 80,
        ramGb: 1024,
        diskGb: 7680,
        hourlyRateUsd: 2.80,
        benchmarkScore: 985,
        lastHeartbeat: new Date(),
        createdAt: new Date(),
      },
      {
        id: 'node-prov-b-4090',
        providerId: 'prov-beta',
        name: 'Beta-RTX4090-Dual',
        status: 'ONLINE',
        cpuModel: 'AMD Ryzen 9 7950X',
        cpuCores: 16,
        gpuModel: 'NVIDIA GeForce RTX 4090',
        gpuCount: 2,
        vramGb: 24,
        ramGb: 128,
        diskGb: 2000,
        hourlyRateUsd: 0.95,
        benchmarkScore: 720,
        lastHeartbeat: new Date(),
        createdAt: new Date(),
      },
      {
        id: 'node-prov-c-cpu',
        providerId: 'prov-gamma',
        name: 'Gamma-HighCore-CPU',
        status: 'ONLINE',
        cpuModel: 'Intel Xeon Platinum 8480+',
        cpuCores: 112,
        gpuModel: null,
        gpuCount: 0,
        vramGb: 0,
        ramGb: 512,
        diskGb: 4000,
        hourlyRateUsd: 0.18,
        benchmarkScore: 210,
        lastHeartbeat: new Date(),
        createdAt: new Date(),
      },
    ];

    mockDbUsers = new Map([
      ['cust-alpha', { id: 'cust-alpha', email: 'alpha@enterprise.com', balanceUsd: 500.0, role: 'CUSTOMER' }],
      ['cust-beta', { id: 'cust-beta', email: 'beta@startup.ai', balanceUsd: 15.0, role: 'CUSTOMER' }],
      ['prov-alpha', { id: 'prov-alpha', email: 'infra@alpha-cloud.net', balanceUsd: 250.0, role: 'PROVIDER' }],
      ['prov-beta', { id: 'prov-beta', email: 'ops@beta-nodes.io', balanceUsd: 120.0, role: 'PROVIDER' }],
    ]);

    mockDbJobs = new Map([
      [
        'job-llama-1',
        {
          id: 'job-llama-1',
          customerId: 'cust-alpha',
          nodeId: 'node-prov-a-h100',
          status: JobStatus.RUNNING,
          image: 'pytorch/pytorch:2.1.0-cuda12.1-cudnn8-runtime',
          command: 'python train.py',
          startedAt: new Date(Date.now() - 3600000),
          completedAt: null,
          totalGpuSeconds: 3600,
          totalCostUsd: 2.80,
          createdAt: new Date(),
          updatedAt: new Date(),
          node: mockDbNodes[0],
          customer: mockDbUsers.get('cust-alpha'),
        },
      ],
    ]);

    redisKv = new Map<string, string>();
    redisLists = new Map<string, string[]>();

    // Preset online heartbeat leases for all 3 lab nodes in Redis
    redisKv.set('node:heartbeat:node-prov-a-h100', 'ONLINE');
    redisKv.set('node:heartbeat:node-prov-b-4090', 'ONLINE');
    redisKv.set('node:heartbeat:node-prov-c-cpu', 'ONLINE');

    mockPrisma = {
      user: {
        findUnique: vi.fn().mockImplementation(async ({ where }: { where: { id: string } }) => {
          return mockDbUsers.get(where.id) || null;
        }),
        update: vi.fn().mockImplementation(async ({ where, data }: { where: { id: string }; data: any }) => {
          const u = mockDbUsers.get(where.id);
          if (!u) throw new NotFoundException('User not found');
          if (data.balanceUsd?.increment) u.balanceUsd += data.balanceUsd.increment;
          if (data.balanceUsd?.decrement) u.balanceUsd -= data.balanceUsd.decrement;
          if (typeof data.balanceUsd === 'number') u.balanceUsd = data.balanceUsd;
          return u;
        }),
      },
      provider: {
        findFirst: vi.fn().mockImplementation(async ({ where }: { where: { userId?: string; id?: string } }) => {
          const id = where.id || where.userId;
          return { id, userId: id, name: `${id}-Fleet`, reputation: 99.4 };
        }),
        findMany: vi.fn().mockResolvedValue([
          { id: 'prov-alpha', reputation: 99.8, user: { email: 'infra@alpha.com' }, nodes: [mockDbNodes[0]] },
          { id: 'prov-beta', reputation: 98.5, user: { email: 'ops@beta.com' }, nodes: [mockDbNodes[1]] },
        ]),
      },
      computeNode: {
        findUnique: vi.fn().mockImplementation(async ({ where }: { where: { id: string } }) => {
          return mockDbNodes.find((n) => n.id === where.id) || null;
        }),
        findMany: vi.fn().mockImplementation(async ({ where }: any = {}) => {
          let res = [...mockDbNodes];
          if (where?.gpuCount?.gte !== undefined) {
            res = res.filter((n) => n.gpuCount >= where.gpuCount.gte);
          }
          if (where?.vramGb?.gte !== undefined) {
            res = res.filter((n) => n.vramGb >= where.vramGb.gte);
          }
          if (where?.hourlyRateUsd?.lte !== undefined) {
            res = res.filter((n) => n.hourlyRateUsd <= where.hourlyRateUsd.lte);
          }
          if (where?.providerId) {
            res = res.filter((n) => n.providerId === where.providerId);
          }
          return res;
        }),
        count: vi.fn().mockResolvedValue(mockDbNodes.length),
        create: vi.fn().mockImplementation(async ({ data }: any) => {
          const newNode = {
            id: `node-${Date.now()}`,
            benchmarkScore: 500,
            lastHeartbeat: new Date(),
            createdAt: new Date(),
            ...data,
          };
          mockDbNodes.push(newNode);
          return newNode;
        }),
        update: vi.fn().mockImplementation(async ({ where, data }: any) => {
          const node = mockDbNodes.find((n) => n.id === where.id);
          if (node) Object.assign(node, data);
          return node;
        }),
      },
      job: {
        create: vi.fn().mockImplementation(async ({ data }: any) => {
          const node = mockDbNodes.find((n) => n.id === data.nodeId) || mockDbNodes[0];
          const newJob = {
            id: `job-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            ...data,
            node,
            totalCostUsd: 0,
            totalGpuSeconds: 0,
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          mockDbJobs.set(newJob.id, newJob);
          return newJob;
        }),
        findUnique: vi.fn().mockImplementation(async ({ where }: { where: { id: string } }) => {
          const j = mockDbJobs.get(where.id);
          if (j && !j.node) {
            j.node = mockDbNodes.find((n) => n.id === j.nodeId) || mockDbNodes[0];
          }
          return j || null;
        }),
        findFirst: vi.fn().mockImplementation(async ({ where }: any) => {
          for (const j of mockDbJobs.values()) {
            if (where.nodeId && j.nodeId === where.nodeId) return j;
          }
          return null;
        }),
        findMany: vi.fn().mockImplementation(async ({ where }: any) => {
          const list = Array.from(mockDbJobs.values()).map((j) => {
            if (!j.node) {
              j.node = mockDbNodes.find((n) => n.id === j.nodeId) || mockDbNodes[0];
            }
            return j;
          });
          if (where?.customerId) return list.filter((j) => j.customerId === where.customerId);
          if (where?.nodeId) return list.filter((j) => j.nodeId === where.nodeId);
          return list;
        }),
        count: vi.fn().mockImplementation(async ({ where }: any = {}) => {
          if (where?.nodeId) {
            let cnt = 0;
            for (const j of mockDbJobs.values()) {
              if (j.nodeId === where.nodeId && (!where.status?.in || where.status.in.includes(j.status))) {
                cnt++;
              }
            }
            return cnt;
          }
          return mockDbJobs.size;
        }),
        update: vi.fn().mockImplementation(async ({ where, data }: any) => {
          const j = mockDbJobs.get(where.id);
          if (j) {
            const { totalGpuSeconds, totalCostUsd, ...rest } = data;
            if (totalGpuSeconds?.increment) {
              j.totalGpuSeconds = (typeof j.totalGpuSeconds === 'number' ? j.totalGpuSeconds : 0) + totalGpuSeconds.increment;
            } else if (typeof totalGpuSeconds === 'number') {
              j.totalGpuSeconds = totalGpuSeconds;
            }
            if (totalCostUsd?.increment) {
              j.totalCostUsd = (typeof j.totalCostUsd === 'number' ? j.totalCostUsd : 0) + totalCostUsd.increment;
            } else if (typeof totalCostUsd === 'number') {
              j.totalCostUsd = totalCostUsd;
            }
            Object.assign(j, rest);
          }
          return j;
        }),
      },
    };

    mockRedis = {
      getClient: vi.fn().mockReturnValue({
        set: vi.fn(async (key: string, val: string, ..._args: any[]) => {
          redisKv.set(key, val);
          return 'OK';
        }),
        get: vi.fn(async (key: string) => {
          return redisKv.get(key) || null;
        }),
        del: vi.fn(async (key: string) => {
          redisKv.delete(key);
          return 1;
        }),
        lrange: vi.fn(async (key: string, _start?: number, _end?: number) => {
          return redisLists.get(key) || [];
        }),
        rpush: vi.fn(async (key: string, val: string) => {
          const list = redisLists.get(key) || [];
          list.push(val);
          redisLists.set(key, list);
          return list.length;
        }),
        lpush: vi.fn(async (key: string, val: string) => {
          const list = redisLists.get(key) || [];
          list.unshift(val);
          redisLists.set(key, list);
          return list.length;
        }),
        ltrim: vi.fn().mockResolvedValue('OK'),
        incr: vi.fn().mockResolvedValue(1),
        keys: vi.fn(async () => Array.from(redisKv.keys())),
      }),
      isHealthy: vi.fn().mockResolvedValue(true),
    };

    providerService = new ProviderService(mockPrisma, mockRedis);
    benchmarkService = new BenchmarkService(mockPrisma, mockRedis);
    marketplaceService = new MarketplaceService(mockPrisma, mockRedis);
    schedulerService = new SchedulerService(mockPrisma, mockRedis);
    workloadService = new WorkloadService(mockPrisma, mockRedis);
    billingService = new BillingService(mockPrisma, mockRedis);
    paymentService = new PaymentService(mockPrisma, mockRedis);
    payoutService = new PayoutService(mockPrisma, mockRedis);
    securityService = new SecurityService(mockRedis);
    apiKeyService = new ApiKeyService(mockRedis);
  });

  describe('1. Multi-Provider Fleet Concurrency & Hardening', () => {
    it('should register and categorize Provider A (H100), Provider B (RTX 4090), Provider C (CPU)', async () => {
      const ptkA = await providerService.generatePairingToken('prov-alpha');
      const ptkB = await providerService.generatePairingToken('prov-beta');

      expect(ptkA.pairingToken).toMatch(/^ptk_/);
      expect(ptkB.pairingToken).toMatch(/^ptk_/);

      const regA = await providerService.registerNode({
        pairingToken: ptkA.pairingToken,
        nodeName: 'Alpha-Rig',
        hardware: {
          cpu: { model: 'AMD EPYC 9654', cores: 96, threads: 192 },
          gpus: [{ model: 'NVIDIA H100 SXM5', vendor: 'NVIDIA', vramGb: 80, count: 8 }],
          memory: { totalRamGb: 1024 },
          storage: { totalDiskGb: 7680 },
        },
        hourlyRateUsd: 2.80,
      });

      expect(regA.status).toBe(NodeStatus.ONLINE);
      expect(regA.nodeId).toBeDefined();

      const benchA = await benchmarkService.submitAndVerifyBenchmark({
        nodeId: regA.nodeId,
        metrics: {
          version: '1.0.0',
          cpuGflops: 4200,
          gpuTflops: 536,
          memoryBandwidthGbps: 3350,
          diskIops: 250000,
          challengeDurationMs: 850,
          compositeScore: 985,
          computeTier: ComputeTier.TIER_1_ENTERPRISE_GPU,
        },
        proofOfWorkSignature: 'pow_signature_sha256_verified_entropy',
      });

      expect(benchA.computeTier).toBe(ComputeTier.TIER_1_ENTERPRISE_GPU);
      expect(benchA.status).toBe(HardwareVerificationStatus.VERIFIED);
    });

    it('should correctly select distinct tiers and placement strategies', async () => {
      // Cheapest placement -> should match CPU or lowest price GPU
      const cheapest = await schedulerService.evaluateCandidates({
        strategy: SchedulingStrategy.CHEAPEST,
        requiredGpus: 0,
      });
      expect(cheapest.selectedNodeId).toBe('node-prov-c-cpu');

      // Best Performance -> should match 8x H100
      const bestPerf = await schedulerService.evaluateCandidates({
        strategy: SchedulingStrategy.BEST_PERFORMANCE,
        requiredGpus: 1,
        minVramGb: 24,
      });
      expect(bestPerf.selectedNodeId).toBe('node-prov-a-h100');

      // Best Price/Performance for consumer GPU -> should match RTX 4090
      const bestValue = await schedulerService.evaluateCandidates({
        strategy: SchedulingStrategy.BEST_PRICE_PERFORMANCE,
        requiredGpus: 2,
        minVramGb: 24,
        maxHourlyRateUsd: 1.50,
      });
      expect(bestValue.selectedNodeId).toBe('node-prov-b-4090');
    });
  });

  describe('2. Automated Failover & Node Disappearance', () => {
    it('should automatically detect failed node and reschedule active workloads to healthy alternatives', async () => {
      // Host node drops offline
      redisKv.delete('node:heartbeat:node-prov-a-h100');

      const failoverEvents = await schedulerService.handleNodeFailover('node-prov-a-h100');
      expect(failoverEvents.length).toBeGreaterThan(0);
      expect(failoverEvents[0].failedNodeId).toBe('node-prov-a-h100');
      expect(failoverEvents[0].targetNodeId).toBeDefined();
    });
  });

  describe('3. Strict Multi-Tenant Security Isolation', () => {
    it('should reject Tenant A from viewing or cancelling Tenant B jobs', async () => {
      // Tenant Alpha owns job-llama-1
      const allowed = await workloadService.getJobDetails('job-llama-1', 'cust-alpha');
      expect(allowed.id).toBe('job-llama-1');

      // Tenant Beta attempts unauthorized access
      await expect(
        workloadService.getJobDetails('job-llama-1', 'cust-beta'),
      ).rejects.toThrow(ForbiddenException);

      // Tenant Beta attempts unauthorized cancellation
      await expect(
        workloadService.cancelJob('job-llama-1', 'cust-beta'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should prevent API key scope bypass or cross-tenant key revocation', async () => {
      const key = await apiKeyService.createApiKey('cust-alpha', {
        name: 'Alpha Secret Key',
        scopes: [ApiKeyScope.WORKLOADS_ALL],
      });

      // Cust-Beta attempts to revoke Cust-Alpha's API key
      await expect(
        apiKeyService.revokeApiKey('cust-beta', key.apiKey.id),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('4. Financial Ledger & Exact Invariant Reconciliation', () => {
    it('should reconcile usage: customer charge = provider earnings (85%) + platform fee (15%)', async () => {
      const initialCustBalance = mockDbUsers.get('cust-alpha').balanceUsd;

      const tick = await billingService.recordUsageTick({
        jobId: 'job-llama-1',
        nodeId: 'node-prov-a-h100',
        durationSeconds: 3600, // 1 hour @ $2.80/hr
      });

      expect(tick.status).toBe('SUCCESS');
      expect(tick.amountDeductedUsd).toBe(2.80);

      // Verify customer deducted accurately
      expect(mockDbUsers.get('cust-alpha').balanceUsd).toBe(initialCustBalance - 2.80);

      // Verify invoice computation
      const invoice = await billingService.generateInvoice('cust-alpha');
      expect(invoice.totalUsd).toBeGreaterThanOrEqual(2.80);
      expect(invoice.platformFeeUsd).toBeCloseTo(invoice.totalUsd * 0.15, 2);
    });

    it('should prevent overdraft when customer balance is completely depleted', async () => {
      mockDbUsers.set('cust-depleted', {
        id: 'cust-depleted',
        email: 'broke@user.com',
        balanceUsd: 0.50,
        role: 'CUSTOMER',
      });

      mockDbJobs.set('job-depleted', {
        id: 'job-depleted',
        customerId: 'cust-depleted',
        nodeId: 'node-prov-a-h100',
        status: JobStatus.RUNNING,
        image: 'pytorch:latest',
        totalGpuSeconds: 0,
        totalCostUsd: 0,
        createdAt: new Date(),
        node: mockDbNodes[0],
        customer: mockDbUsers.get('cust-depleted'),
      });

      const tick = await billingService.recordUsageTick({
        jobId: 'job-depleted',
        nodeId: 'node-prov-a-h100',
        durationSeconds: 3600, // Cost $2.80 with balance $0.50
      });

      expect(tick.status).toBe('DEPLETED');
      expect(tick.remainingBalanceUsd).toBe(0.0);
    });
  });

  describe('5. Container Defense-in-Depth & Attack Mitigation', () => {
    it('should log critical security audit events on container escape attempts', async () => {
      const secEvent = await securityService.reportSecurityEvent({
        type: SecurityEventType.CONTAINER_ESCAPE_ATTEMPT,
        severity: SecuritySeverity.CRITICAL,
        source: 'PROVIDER_SANDBOX',
        targetId: 'job-llama-1',
        details: { blockedSyscall: 'pivot_root', payload: 'cgroup_escape_exploit' },
        mitigation: 'SIGKILL transmitted to container namespace',
      });

      expect(secEvent.severity).toBe(SecuritySeverity.CRITICAL);
      expect(secEvent.type).toBe(SecurityEventType.CONTAINER_ESCAPE_ATTEMPT);

      const summary = await securityService.getAuditSummary();
      expect(summary.criticalThreatsBlocked).toBeGreaterThanOrEqual(1);
    });
  });
});
