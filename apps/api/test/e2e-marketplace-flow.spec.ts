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
import { MetricsService } from '../src/modules/metrics/metrics.service';
import { ReputationService } from '../src/modules/reputation/reputation.service';
import { ApiKeyService } from '../src/modules/api-key/api-key.service';
import {
  ComputeTier,
  HardwareVerificationStatus,
  SchedulingStrategy,
  PaymentMethod,
  PayoutDestinationType,
  DisputeReason,
  DisputeStatus,
  ApiKeyScope,
  SecurityEventType,
  SecuritySeverity,
} from '@distributed-compute/shared-types';
import { UnauthorizedException, BadRequestException } from '@nestjs/common';

describe('Master End-to-End Marketplace Lifecycle Integration Test', () => {
  let authService: AuthService;
  let providerService: ProviderService;
  let benchmarkService: BenchmarkService;
  let marketplaceService: MarketplaceService;
  let workloadService: WorkloadService;
  let schedulerService: SchedulerService;
  let billingService: BillingService;
  let paymentService: PaymentService;
  let payoutService: PayoutService;
  let securityService: SecurityService;
  let metricsService: MetricsService;
  let reputationService: ReputationService;
  let apiKeyService: ApiKeyService;

  let mockPrisma: any;
  let mockRedis: any;
  let mockJwt: any;
  let mockConfig: any;
  let redisKv: Map<string, string>;
  let redisLists: Map<string, string[]>;

  beforeEach(() => {
    redisKv = new Map<string, string>();
    redisLists = new Map<string, string[]>();

    mockPrisma = {
      user: {
        findUnique: vi.fn().mockImplementation(async ({ where }: { where: { id: string } }) => {
          if (where.id === 'user-poor-cust') {
            return {
              id: 'user-poor-cust',
              email: 'poor@student.edu',
              passwordHash: '$2b$10$abcdef',
              role: 'CUSTOMER',
              balanceUsd: 1.0,
              createdAt: new Date(),
            };
          }
          return {
            id: 'user-e2e-cust',
            email: 'researcher@ai-lab.org',
            passwordHash: '$2b$10$abcdef',
            role: 'CUSTOMER',
            balanceUsd: 100.0,
            createdAt: new Date(),
          };
        }),
        create: vi.fn().mockResolvedValue({
          id: 'user-e2e-prov',
          email: 'provider@infra.io',
          role: 'PROVIDER',
          balanceUsd: 150.0,
          createdAt: new Date(),
        }),
        update: vi.fn().mockResolvedValue({
          id: 'user-e2e-cust',
          balanceUsd: 150.0,
        }),
      },
      provider: {
        findFirst: vi.fn().mockResolvedValue({
          id: 'prov-e2e-1',
          userId: 'user-e2e-prov',
          name: 'Apex GPU Cloud',
          reputation: 99.5,
        }),
        findUnique: vi.fn().mockResolvedValue({
          id: 'prov-e2e-1',
          userId: 'user-e2e-prov',
          name: 'Apex GPU Cloud',
          reputation: 99.5,
        }),
        create: vi.fn().mockResolvedValue({
          id: 'prov-e2e-1',
          userId: 'user-e2e-prov',
          name: 'Apex GPU Cloud',
          reputation: 99.5,
        }),
        findMany: vi.fn().mockResolvedValue([
          {
            id: 'prov-e2e-1',
            reputation: 99.5,
            user: { email: 'provider@infra.io' },
            nodes: [{ id: 'node-e2e-h100', reliabilityScore: 99.5 }],
          },
        ]),
      },
      computeNode: {
        findUnique: vi.fn().mockImplementation(async ({ where }: { where: { id: string } }) => {
          if (where.id === 'node-fake-gpu') {
            return {
              id: 'node-fake-gpu',
              providerId: 'prov-e2e-1',
              name: 'Fake-H100-Node',
              status: 'ONLINE',
              cpuModel: 'Intel Core i3',
              cpuCores: 4,
              gpuModel: 'NVIDIA H100 SXM5',
              gpuCount: 8,
              vramGb: 80,
              ramGb: 16,
              diskGb: 256,
              hourlyRateUsd: 1.0,
              benchmarkScore: 200,
              lastHeartbeat: new Date(),
              createdAt: new Date(),
            };
          }
          return {
            id: 'node-e2e-h100',
            providerId: 'prov-e2e-1',
            name: 'H100-SXM5-Node',
            status: 'ONLINE',
            cpuModel: 'AMD EPYC 9654',
            cpuCores: 96,
            gpuModel: 'NVIDIA H100 SXM5',
            gpuCount: 8,
            vramGb: 80,
            ramGb: 1024,
            diskGb: 7680,
            hourlyRateUsd: 2.85,
            benchmarkScore: 980,
            lastHeartbeat: new Date(),
            createdAt: new Date(),
          };
        }),
        findMany: vi.fn().mockResolvedValue([
          {
            id: 'node-e2e-h100',
            providerId: 'prov-e2e-1',
            name: 'H100-SXM5-Node',
            status: 'ONLINE',
            cpuModel: 'AMD EPYC 9654',
            cpuCores: 96,
            gpuModel: 'NVIDIA H100 SXM5',
            gpuCount: 8,
            vramGb: 80,
            ramGb: 1024,
            diskGb: 7680,
            hourlyRateUsd: 2.85,
            benchmarkScore: 980,
            lastHeartbeat: new Date(),
            createdAt: new Date(),
          },
        ]),
        count: vi.fn().mockResolvedValue(1),
        create: vi.fn().mockResolvedValue({
          id: 'node-e2e-h100',
          name: 'H100-SXM5-Node',
          status: 'ONLINE',
        }),
        update: vi.fn().mockResolvedValue({
          id: 'node-e2e-h100',
          benchmarkScore: 980,
        }),
      },
      job: {
        create: vi.fn().mockResolvedValue({
          id: 'job-e2e-llama3',
          customerId: 'user-e2e-cust',
          nodeId: 'node-e2e-h100',
          status: 'PENDING',
          image: 'pytorch/pytorch:2.1.0-cuda12.1-cudnn8-runtime',
          command: 'python train_distributed.py',
          totalGpuSeconds: 0,
          totalCostUsd: 0.0,
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
        findUnique: vi.fn().mockResolvedValue({
          id: 'job-e2e-llama3',
          customerId: 'user-e2e-cust',
          nodeId: 'node-e2e-h100',
          status: 'RUNNING',
          image: 'pytorch/pytorch:2.1.0-cuda12.1-cudnn8-runtime',
          totalGpuSeconds: 3600,
          totalCostUsd: 2.85,
          createdAt: new Date(),
          updatedAt: new Date(),
          node: {
            id: 'node-e2e-h100',
            hourlyRateUsd: 2.85,
          },
          customer: {
            id: 'user-e2e-cust',
            balanceUsd: 100.0,
          },
        }),
        findMany: vi.fn().mockResolvedValue([]),
        update: vi.fn().mockResolvedValue({
          id: 'job-e2e-llama3',
          status: 'COMPLETED',
          totalGpuSeconds: 3600,
          totalCostUsd: 2.85,
        }),
      },
      usageRecord: {
        create: vi.fn().mockResolvedValue({
          id: 'usage-1',
          jobId: 'job-e2e-llama3',
          costUsd: 2.85,
        }),
        findMany: vi.fn().mockResolvedValue([]),
      },
      invoice: {
        create: vi.fn().mockResolvedValue({
          id: 'inv-1',
          userId: 'user-e2e-cust',
          amountUsd: 2.85,
          status: 'PAID',
          lineItems: [],
          createdAt: new Date(),
        }),
        findMany: vi.fn().mockResolvedValue([]),
      },
    };

    mockRedis = {
      getClient: vi.fn().mockReturnValue({
        set: vi.fn(async (key: string, val: string) => {
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
        lrange: vi.fn(async (key: string) => {
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
        keys: vi.fn(async () => {
          return Array.from(redisKv.keys());
        }),
      }),
      isHealthy: vi.fn().mockResolvedValue(true),
    };

    mockJwt = {
      signAsync: vi.fn().mockResolvedValue('mock-jwt-token'),
      verifyAsync: vi.fn().mockResolvedValue({ sub: 'user-1', email: 'test@example.com', role: 'CUSTOMER' }),
    };

    mockConfig = {
      get: vi.fn((key: string) => {
        if (key === 'jwt.secret') return 'test-secret';
        if (key === 'jwt.refreshSecret') return 'test-refresh-secret';
        return null;
      }),
    };

    // Instantiate all modules
    authService = new AuthService(mockPrisma, mockJwt, mockConfig);
    providerService = new ProviderService(mockPrisma, mockRedis);
    benchmarkService = new BenchmarkService(mockPrisma, mockRedis);
    marketplaceService = new MarketplaceService(mockPrisma, mockRedis);
    schedulerService = new SchedulerService(mockPrisma, mockRedis);
    workloadService = new WorkloadService(mockPrisma, mockRedis);
    billingService = new BillingService(mockPrisma, mockRedis);
    paymentService = new PaymentService(mockPrisma, mockRedis);
    payoutService = new PayoutService(mockPrisma, mockRedis);
    securityService = new SecurityService(mockRedis);
    metricsService = new MetricsService(mockPrisma, mockRedis);
    reputationService = new ReputationService(mockPrisma, mockRedis);
    apiKeyService = new ApiKeyService(mockRedis);
  });

  it('Stage 1 - 12: should successfully execute the complete 12-stage marketplace lifecycle', async () => {
    // Stage 1: Provider Registration & Pairing Token Handshake
    const pairing = await providerService.generatePairingToken('prov-e2e-1');
    expect(pairing.pairingToken).toBeDefined();
    expect(pairing.quickstartCommand).toContain('PAIRING_TOKEN=');

    const reg = await providerService.registerNode({
      pairingToken: pairing.pairingToken,
      nodeName: 'H100-SXM5-Node',
      hardware: {
        cpu: { model: 'AMD EPYC 9654', cores: 96, threads: 192 },
        gpus: [{ model: 'NVIDIA H100 SXM5', vendor: 'NVIDIA', vramGb: 80, count: 8 }],
        memory: { totalRamGb: 1024 },
        storage: { totalDiskGb: 7680 },
      },
      hourlyRateUsd: 2.85,
    });
    expect(reg.nodeId).toBeDefined();

    // Stage 2: Hardware Benchmark & Tier 1 Verification
    const benchRes = await benchmarkService.submitAndVerifyBenchmark({
      nodeId: reg.nodeId,
      metrics: {
        version: '1.0.0',
        cpuGflops: 4200,
        gpuTflops: 580,
        memoryBandwidthGbps: 3350,
        diskIops: 250000,
        challengeDurationMs: 1200,
        compositeScore: 980,
        computeTier: ComputeTier.TIER_1_ENTERPRISE_GPU,
      },
      proofOfWorkSignature: 'pow_valid_sig_with_sufficient_entropy',
    });
    expect(benchRes.status).toBe(HardwareVerificationStatus.VERIFIED);
    expect(benchRes.computeTier).toBe(ComputeTier.TIER_1_ENTERPRISE_GPU);

    // Stage 3: Marketplace Discovery & Fast Search
    const catalog = await marketplaceService.searchNodes({ tier: ComputeTier.TIER_1_ENTERPRISE_GPU });
    expect(catalog.nodes.length).toBeGreaterThan(0);
    expect(catalog.stats.lowestHourlyRateUsd).toBe(2.85);

    // Stage 4: Customer Wallet Deposit & Escrow Lock
    const deposit = await paymentService.processDeposit({
      userId: 'user-e2e-cust',
      amountUsd: 50.0,
      method: PaymentMethod.CRYPTO_USDC,
    });
    expect(deposit.status).toBe('CONFIRMED');

    const escrow = await paymentService.lockEscrow({
      customerId: 'user-e2e-cust',
      jobId: 'job-e2e-llama3',
      providerId: 'prov-e2e-1',
      estimatedBudgetUsd: 25.0,
    });
    expect(escrow.amountLockedUsd).toBe(25.0);

    // Stage 5: Multi-Objective Scheduler Evaluation & Placement
    const decision = await schedulerService.evaluateCandidates({
      strategy: SchedulingStrategy.BEST_PRICE_PERFORMANCE,
      requiredGpus: 8,
      minVramGb: 80,
    });
    expect(decision.selectedNodeId).toBe('node-e2e-h100');

    // Stage 6: Workload Submission & Container Execution
    const job = await workloadService.createJob('user-e2e-cust', {
      nodeId: 'node-e2e-h100',
      image: 'pytorch/pytorch:2.1.0-cuda12.1-cudnn8-runtime',
      command: 'python train_distributed.py',
    });
    expect(job.id).toBeDefined();

    // Stage 7: Per-Second Usage Metering Tick & Burn Rate
    const tick = await billingService.recordUsageTick({
      jobId: job.id,
      nodeId: 'node-e2e-h100',
      durationSeconds: 3600,
    });
    expect(tick.amountDeductedUsd).toBe(2.85);
    expect(tick.status).toBe('SUCCESS');

    // Stage 8: Job Completion & Escrow Settlement
    const settledEscrow = await paymentService.settleEscrow({
      jobId: job.id,
      actualCostUsd: 2.85,
    });
    expect(settledEscrow.amountSettledUsd).toBe(2.85);

    // Stage 9: Provider Payout Execution
    const payout = await payoutService.requestPayout({
      providerId: 'prov-e2e-1',
      amountUsd: 100.0,
      destinationType: PayoutDestinationType.BANK_STRIPE_CONNECT,
      destinationTarget: 'acct_stripe_e2e_123',
    });
    expect(payout.netAmountUsd).toBe(98.5); // $100 - $1.50 network fee

    // Stage 10: SLA Reliability Scoring & Dispute Arbitration
    const reliability = await reputationService.getNodeReliability('node-e2e-h100');
    expect(reliability.compositeReliabilityScore).toBeGreaterThanOrEqual(95);

    const dispute = await reputationService.submitDispute('user-e2e-cust', {
      jobId: 'job-failed-sim',
      reason: DisputeReason.PREMATURE_TERMINATION,
      description: 'Host node heartbeat lost midway',
      claimAmountUsd: 10.0,
    });
    const arbitrated = await reputationService.arbitrateDispute(dispute.id, {
      status: DisputeStatus.RESOLVED_REFUNDED,
      arbitrationNotes: 'Confirmed node outage via telemetry. 100% refund.',
      refundedAmountUsd: 10.0,
    });
    expect(arbitrated.status).toBe(DisputeStatus.RESOLVED_REFUNDED);

    // Stage 11: Security Telemetry & Prometheus Metric Exporter
    await securityService.reportSecurityEvent({
      type: SecurityEventType.RESTRICTED_SYSCALL_BLOCKED,
      severity: SecuritySeverity.HIGH,
      source: 'PROVIDER_SANDBOX',
      targetId: job.id,
      details: { syscall: 'ptrace', blocked: true },
      mitigation: 'Terminated offending thread in gVisor sandbox',
    });
    const audit = await securityService.getAuditSummary();
    expect(audit.totalEventsLogged).toBeGreaterThan(0);

    const prometheusText = await metricsService.getPrometheusExposition();
    expect(prometheusText).toContain('compute_marketplace_http_requests_total');
    expect(prometheusText).toContain('compute_marketplace_nodes_online_gauge');

    // Stage 12: Scoped Developer API Key Authentication
    const apiKey = await apiKeyService.createApiKey('user-e2e-cust', {
      name: 'Automated CI/CD Key',
      scopes: [ApiKeyScope.WORKLOADS_ALL, ApiKeyScope.NODES_READ],
    });
    expect(apiKey.rawSecretKey).toMatch(/^dc_live_/);
    expect(apiKey.apiKey.scopes).toContain(ApiKeyScope.WORKLOADS_ALL);
  });

  it('should reject node registration with invalid or expired pairing token', async () => {
    await expect(
      providerService.registerNode({
        pairingToken: 'ptk_invalid_expired_token_12345',
        nodeName: 'Rogue-Node',
        hardware: {
          cpu: { model: 'AMD', cores: 8, threads: 16 },
          gpus: [],
          memory: { totalRamGb: 32 },
          storage: { totalDiskGb: 500 },
        },
      }),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('should flag hardware spoofing attempts with SUSPICIOUS verification status', async () => {
    const spoofResult = await benchmarkService.submitAndVerifyBenchmark({
      nodeId: 'node-fake-gpu',
      metrics: {
        version: '1.0.0',
        cpuGflops: 150,
        gpuTflops: 15, // Claiming H100 but delivering low TFLOPS
        memoryBandwidthGbps: 100,
        diskIops: 2000,
        challengeDurationMs: 8000,
        compositeScore: 200,
        computeTier: ComputeTier.TIER_1_ENTERPRISE_GPU,
      },
      proofOfWorkSignature: 'pow_valid_sig_with_sufficient_entropy',
    });

    expect(spoofResult.status).toBe(HardwareVerificationStatus.SUSPICIOUS);
    expect(spoofResult.reason).toContain('benchmark score is lower than expected baseline');
  });

  it('should prevent escrow lock when customer balance is insufficient', async () => {
    await expect(
      paymentService.lockEscrow({
        customerId: 'user-poor-cust',
        jobId: 'job-unaffordable',
        providerId: 'prov-e2e-1',
        estimatedBudgetUsd: 100.0,
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('should enforce developer API key scopes and instant revocation', async () => {
    const createdKey = await apiKeyService.createApiKey('user-e2e-cust', {
      name: 'Read Only Key',
      scopes: [ApiKeyScope.NODES_READ],
    });

    expect(createdKey.apiKey.scopes).toEqual([ApiKeyScope.NODES_READ]);
    expect(createdKey.apiKey.scopes).not.toContain(ApiKeyScope.WORKLOADS_ALL);

    // Verify key validation returns correct user and scopes
    const verified = await apiKeyService.validateApiKey(createdKey.rawSecretKey);
    expect(verified).toBeDefined();
    expect(verified?.userId).toBe('user-e2e-cust');

    // Revoke key
    await apiKeyService.revokeApiKey('user-e2e-cust', createdKey.apiKey.id);

    // Verify revoked key is rejected
    const revokedCheck = await apiKeyService.validateApiKey(createdKey.rawSecretKey);
    expect(revokedCheck).toBeNull();
  });
});
