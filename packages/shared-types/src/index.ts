/**
 * Shared Type Definitions for Distributed Compute Marketplace
 */

export enum UserRole {
  GUEST = 'GUEST',
  CUSTOMER = 'CUSTOMER',
  PROVIDER = 'PROVIDER',
  ADMIN = 'ADMIN',
  AGENT = 'AGENT',
}

export enum NodeStatus {
  ONLINE = 'ONLINE',
  BUSY = 'BUSY',
  DRAINING = 'DRAINING',
  OFFLINE = 'OFFLINE',
  MAINTENANCE = 'MAINTENANCE',
}

export enum JobStatus {
  PENDING = 'PENDING',
  SCHEDULED = 'SCHEDULED',
  PROVISIONING = 'PROVISIONING',
  RUNNING = 'RUNNING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
}

export enum SchedulingStrategy {
  CHEAPEST = 'CHEAPEST',
  BEST_PERFORMANCE = 'BEST_PERFORMANCE',
  BEST_PRICE_PERFORMANCE = 'BEST_PRICE_PERFORMANCE',
  HIGHEST_RELIABILITY = 'HIGHEST_RELIABILITY',
  CUSTOM_WEIGHTS = 'CUSTOM_WEIGHTS',
}

export enum ComputeTier {
  TIER_1_ENTERPRISE_GPU = 'TIER_1_ENTERPRISE_GPU',
  TIER_2_PRO_GPU = 'TIER_2_PRO_GPU',
  TIER_3_CONSUMER_GPU = 'TIER_3_CONSUMER_GPU',
  TIER_4_CPU_ONLY = 'TIER_4_CPU_ONLY',
}

export enum HardwareVerificationStatus {
  VERIFIED = 'VERIFIED',
  SUSPICIOUS = 'SUSPICIOUS',
  REJECTED = 'REJECTED',
  UNVERIFIED = 'UNVERIFIED',
}

export enum SortByOption {
  PRICE_ASC = 'PRICE_ASC',
  PRICE_DESC = 'PRICE_DESC',
  SCORE_DESC = 'SCORE_DESC',
  VRAM_DESC = 'VRAM_DESC',
  RELIABILITY_DESC = 'RELIABILITY_DESC',
}

export enum PaymentMethod {
  FIAT_STRIPE = 'FIAT_STRIPE',
  CRYPTO_USDC = 'CRYPTO_USDC',
  CRYPTO_USDT = 'CRYPTO_USDT',
  CRYPTO_ETH = 'CRYPTO_ETH',
  CRYPTO_SOL = 'CRYPTO_SOL',
}

export enum TransactionType {
  DEPOSIT = 'DEPOSIT',
  ESCROW_LOCK = 'ESCROW_LOCK',
  ESCROW_SETTLE = 'ESCROW_SETTLE',
  ESCROW_REFUND = 'ESCROW_REFUND',
  WITHDRAWAL = 'WITHDRAWAL',
}

export enum EscrowStatus {
  HELD = 'HELD',
  SETTLED = 'SETTLED',
  REFUNDED = 'REFUNDED',
  PARTIALLY_SETTLED = 'PARTIALLY_SETTLED',
}

export enum PayoutDestinationType {
  BANK_STRIPE_CONNECT = 'BANK_STRIPE_CONNECT',
  CRYPTO_USDC = 'CRYPTO_USDC',
  CRYPTO_ETH = 'CRYPTO_ETH',
  CRYPTO_SOL = 'CRYPTO_SOL',
}

export enum PayoutStatus {
  REQUESTED = 'REQUESTED',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

export enum SandboxRuntime {
  STANDARD_OCI = 'STANDARD_OCI',
  GVISOR_RUNSC = 'GVISOR_RUNSC',
  KATA_CONTAINERS = 'KATA_CONTAINERS',
}

export enum NetworkIsolationMode {
  ISOLATED_NONE = 'ISOLATED_NONE',
  RESTRICTED_BRIDGE = 'RESTRICTED_BRIDGE',
  HOST = 'HOST',
}

export enum SecuritySeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export enum SecurityEventType {
  CONTAINER_ESCAPE_ATTEMPT = 'CONTAINER_ESCAPE_ATTEMPT',
  RESTRICTED_SYSCALL_BLOCKED = 'RESTRICTED_SYSCALL_BLOCKED',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  UNAUTHORIZED_DEVICE_ACCESS = 'UNAUTHORIZED_DEVICE_ACCESS',
  SPOOFED_TELEMETRY = 'SPOOFED_TELEMETRY',
  MALICIOUS_IMAGE_BLOCKED = 'MALICIOUS_IMAGE_BLOCKED',
}

export enum MetricType {
  COUNTER = 'COUNTER',
  GAUGE = 'GAUGE',
  HISTOGRAM = 'HISTOGRAM',
}

export enum ProviderReputationBadge {
  ELITE_PROVIDER = 'ELITE_PROVIDER',
  VERIFIED_PROVIDER = 'VERIFIED_PROVIDER',
  COMMUNITY_PROVIDER = 'COMMUNITY_PROVIDER',
  PROBATION = 'PROBATION',
}

export enum DisputeStatus {
  OPEN = 'OPEN',
  UNDER_REVIEW = 'UNDER_REVIEW',
  RESOLVED_REFUNDED = 'RESOLVED_REFUNDED',
  RESOLVED_REJECTED = 'RESOLVED_REJECTED',
}

export enum DisputeReason {
  HARDWARE_MISMATCH = 'HARDWARE_MISMATCH',
  PREMATURE_TERMINATION = 'PREMATURE_TERMINATION',
  UNREACHABLE_NODE = 'UNREACHABLE_NODE',
  CONTAINER_ESCAPE_THREAT = 'CONTAINER_ESCAPE_THREAT',
}

export enum ApiKeyScope {
  WORKLOADS_ALL = 'WORKLOADS_ALL',
  WORKLOADS_READ = 'WORKLOADS_READ',
  NODES_READ = 'NODES_READ',
  BILLING_READ = 'BILLING_READ',
}

export interface UserProfile {
  id: string;
  email: string;
  role: UserRole;
  balanceUsd: number;
  createdAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface AuthResponse {
  user: UserProfile;
  tokens: AuthTokens;
}

export interface RegisterDto {
  email: string;
  password: string;
  role: UserRole;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface GpuSpec {
  model: string;
  vendor: 'NVIDIA' | 'AMD' | 'INTEL' | 'OTHER';
  vramGb: number;
  driverVersion?: string;
  cudaVersion?: string;
  count: number;
}

export interface CpuSpec {
  model: string;
  cores: number;
  threads: number;
  frequencyGhz?: number;
  architecture?: string;
}

export interface MemorySpec {
  totalRamGb: number;
  availableRamGb?: number;
}

export interface StorageSpec {
  totalDiskGb: number;
  freeDiskGb?: number;
}

export interface HardwareProfile {
  os?: string;
  osRelease?: string;
  cpu: CpuSpec;
  gpus: GpuSpec[];
  memory: MemorySpec;
  storage: StorageSpec;
}

export interface PairingTokenResponse {
  pairingToken: string;
  providerId: string;
  expiresInSeconds: number;
  quickstartCommand: string;
}

export interface NodeRegistrationDto {
  pairingToken: string;
  nodeName?: string;
  hardware: HardwareProfile;
  hourlyRateUsd?: number;
}

export interface NodeRegistrationResponse {
  nodeId: string;
  status: NodeStatus;
  apiKey: string;
  heartbeatIntervalSeconds: number;
}

export interface TelemetryMetrics {
  cpuUsagePercent: number;
  ramUsagePercent: number;
  ramUsedGb: number;
  gpuUtilizationPercent: number;
  gpuTemperatureCelsius: number;
}

export interface HeartbeatDto {
  nodeId: string;
  status: NodeStatus;
  timestamp: number;
  metrics: TelemetryMetrics;
}

export interface HeartbeatResponse {
  status: 'ACK' | 'NACK';
  pendingJobId?: string | null;
  timestamp: string;
}

export interface BenchmarkMetrics {
  version: string;
  cpuGflops: number;
  gpuTflops: number;
  memoryBandwidthGbps: number;
  diskIops: number;
  challengeDurationMs: number;
  compositeScore: number;
  computeTier: ComputeTier;
}

export interface BenchmarkSubmissionDto {
  nodeId: string;
  metrics: BenchmarkMetrics;
  proofOfWorkSignature: string;
}

export interface BenchmarkVerificationResult {
  nodeId: string;
  status: HardwareVerificationStatus;
  verifiedScore: number;
  computeTier: ComputeTier;
  confidenceScorePercent: number;
  reason: string;
  timestamp: string;
}

export interface ComputeTierInfo {
  tier: ComputeTier;
  name: string;
  description: string;
  minScore: number;
  sampleGpuModels: string[];
  suggestedHourlyRangeUsd: [number, number];
}

export interface ComputeNode {
  id: string;
  providerId: string;
  name: string;
  status: NodeStatus;
  cpu: CpuSpec;
  gpus: GpuSpec[];
  ramGb: number;
  diskGb: number;
  hourlyRateUsd: number;
  benchmarkScore: number;
  computeTier?: ComputeTier;
  verificationStatus?: HardwareVerificationStatus;
  reliabilityScore: number;
  region?: string;
  lastHeartbeat: string;
  latestTelemetry?: TelemetryMetrics;
  createdAt: string;
}

export interface MarketplaceFilterDto {
  searchQuery?: string;
  tier?: ComputeTier;
  gpuModel?: string;
  minVramGb?: number;
  maxHourlyRateUsd?: number;
  minBenchmarkScore?: number;
  region?: string;
  sortBy?: SortByOption;
  page?: number;
  limit?: number;
}

export interface MarketplaceListResponse {
  nodes: ComputeNode[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  stats: {
    totalOnlineGpus: number;
    totalVramGb: number;
    lowestHourlyRateUsd: number;
    highestBenchmarkScore: number;
  };
}

export interface MarketplaceSummary {
  totalNodesOnline: number;
  totalGpuCount: number;
  totalVramGb: number;
  lowestPriceUsdPerHour: number;
  averageReliabilityPercent: number;
  activeWorkloadsCount: number;
}

export interface CreateJobDto {
  image: string;
  command?: string;
  env?: Record<string, string>;
  gpuCount?: number;
  minVramGb?: number;
  nodeId?: string;
  strategy?: SchedulingStrategy;
  maxDurationMinutes?: number;
}

export interface Job {
  id: string;
  customerId: string;
  nodeId: string;
  status: JobStatus;
  image: string;
  command?: string;
  exitCode?: number | null;
  startedAt?: string | null;
  completedAt?: string | null;
  totalGpuSeconds: number;
  totalCostUsd: number;
  createdAt: string;
  updatedAt: string;
}

export interface JobLogMessage {
  jobId: string;
  timestamp: string;
  stream: 'stdout' | 'stderr';
  line: string;
}

export interface AgentJobStatusUpdateDto {
  jobId: string;
  nodeId: string;
  status: JobStatus;
  exitCode?: number;
  errorReason?: string;
  logs?: string[];
}

export interface SchedulingWeights {
  costWeight: number;
  performanceWeight: number;
  reliabilityWeight: number;
}

export interface ScheduleJobRequest {
  jobId?: string;
  strategy?: SchedulingStrategy;
  weights?: SchedulingWeights;
  requiredGpus?: number;
  minVramGb?: number;
  maxHourlyRateUsd?: number;
  preferredRegion?: string;
  targetNodeId?: string;
}

export interface CandidateNodeScore {
  nodeId: string;
  name: string;
  gpuModel: string;
  gpuCount: number;
  vramGb: number;
  hourlyRateUsd: number;
  benchmarkScore: number;
  reliabilityScore: number;
  costScore: number;
  performanceScore: number;
  reliabilityScoreNormalized: number;
  compositeScore: number;
}

export interface SchedulingDecision {
  jobId?: string;
  strategy: SchedulingStrategy;
  selectedNodeId: string;
  selectedNodeName: string;
  estimatedHourlyCostUsd: number;
  compositeScore: number;
  totalCandidateCount: number;
  reason: string;
  rankedCandidates: CandidateNodeScore[];
  timestamp: string;
}

export interface FailoverEvent {
  jobId: string;
  failedNodeId: string;
  targetNodeId: string;
  reason: string;
  timestamp: string;
}

export interface UsageRecord {
  id: string;
  jobId: string;
  customerId: string;
  providerId: string;
  nodeId: string;
  gpuSeconds: number;
  cpuSeconds: number;
  ramGbSeconds: number;
  hourlyRateUsd: number;
  costUsd: number;
  providerEarningsUsd: number;
  platformFeeUsd: number;
  timestamp: string;
}

export interface UsageLedgerSummary {
  customerId: string;
  totalGpuSeconds: number;
  totalCostUsd: number;
  currentBurnRateUsdPerHour: number;
  activeJobsCount: number;
  records: UsageRecord[];
}

export interface ProviderEarningsSummary {
  providerId: string;
  totalGrossEarningsUsd: number;
  totalPlatformFeesUsd: number;
  totalNetEarningsUsd: number;
  pendingPayoutUsd: number;
  totalComputeSecondsServed: number;
}

export interface InvoiceLineItem {
  description: string;
  quantity: number;
  unit: string;
  unitPriceUsd: number;
  amountUsd: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  userId: string;
  periodStart: string;
  periodEnd: string;
  subtotalUsd: number;
  platformFeeUsd: number;
  totalUsd: number;
  status: 'PAID' | 'PENDING' | 'OVERDUE';
  lineItems: InvoiceLineItem[];
  createdAt: string;
}

export interface BalanceDeductionEvent {
  userId: string;
  jobId: string;
  amountDeductedUsd: number;
  remainingBalanceUsd: number;
  status: 'SUCCESS' | 'DEPLETED' | 'TERMINATED';
  timestamp: string;
}

export interface EscrowHold {
  id: string;
  jobId: string;
  customerId: string;
  providerId: string;
  amountLockedUsd: number;
  amountSettledUsd: number;
  amountRefundedUsd: number;
  status: EscrowStatus;
  createdAt: string;
  settledAt?: string;
}

export interface WalletTransaction {
  id: string;
  userId: string;
  type: TransactionType;
  amountUsd: number;
  currency: string;
  method?: PaymentMethod;
  referenceId?: string;
  description: string;
  status: 'CONFIRMED' | 'PENDING' | 'FAILED';
  createdAt: string;
}

export interface CryptoDepositAddress {
  symbol: string;
  network: string;
  address: string;
  minDepositUsd: number;
}

export interface WalletSummary {
  userId: string;
  availableBalanceUsd: number;
  lockedInEscrowUsd: number;
  totalDepositedUsd: number;
  cryptoAddresses: CryptoDepositAddress[];
  recentTransactions: WalletTransaction[];
  activeEscrows: EscrowHold[];
}

export interface PayoutDestination {
  id: string;
  providerId: string;
  type: PayoutDestinationType;
  label: string;
  target: string;
  isDefault: boolean;
  verified: boolean;
  createdAt: string;
}

export interface PayoutRequest {
  id: string;
  providerId: string;
  amountUsd: number;
  feeUsd: number;
  netAmountUsd: number;
  destinationType: PayoutDestinationType;
  destinationTarget: string;
  status: PayoutStatus;
  txHashOrRef?: string;
  requestedAt: string;
  processedAt?: string;
}

export interface ProviderEarningsAnalytics {
  providerId: string;
  grossRevenueUsd: number;
  platformFeeUsd: number;
  netEarnedUsd: number;
  availablePayoutBalanceUsd: number;
  totalPaidOutUsd: number;
  activeGpuCount: number;
  averageUtilizationPercent: number;
  estimatedMonthlyYieldUsd: number;
  payoutHistory: PayoutRequest[];
  destinations: PayoutDestination[];
}

export interface SandboxSecurityPolicy {
  runtime: SandboxRuntime;
  dropCapabilities: string[];
  readOnlyRootfs: boolean;
  noNewPrivileges: boolean;
  runAsUser: string;
  seccompProfile: string;
  networkMode: NetworkIsolationMode;
  memoryLimitMb: number;
  cpuQuotaPercent: number;
  pidsLimit: number;
  tmpfsMounts: string[];
}

export interface SecurityEvent {
  id: string;
  type: SecurityEventType;
  severity: SecuritySeverity;
  source: 'API_GATEWAY' | 'PROVIDER_SANDBOX' | 'SCHEDULER' | 'BENCHMARK';
  targetId: string;
  details: Record<string, any>;
  mitigation: string;
  timestamp: string;
}

export interface SecurityAuditSummary {
  totalEventsLogged: number;
  criticalThreatsBlocked: number;
  activeSandboxesHardened: number;
  systemComplianceScorePercent: number;
  policy: SandboxSecurityPolicy;
  recentSecurityEvents: SecurityEvent[];
}

export interface PlatformMetric {
  name: string;
  type: MetricType;
  value: number;
  labels?: Record<string, string>;
  description: string;
}

export interface TraceSpan {
  traceId: string;
  spanId: string;
  parentSpanId?: string;
  name: string;
  serviceName: string;
  durationMs: number;
  status: 'OK' | 'ERROR';
  timestamp: string;
  attributes?: Record<string, any>;
}

export interface ObservabilitySummary {
  totalMetricsExported: number;
  activeTracesSampled: number;
  averageLatencyMs: number;
  errorRatePercent: number;
  requestsPerSecond: number;
  metrics: PlatformMetric[];
  recentTraces: TraceSpan[];
}

export interface DisputeRecord {
  id: string;
  jobId: string;
  customerId: string;
  providerId: string;
  nodeId: string;
  reason: DisputeReason;
  description: string;
  claimAmountUsd: number;
  refundedAmountUsd?: number;
  status: DisputeStatus;
  arbitrationNotes?: string;
  createdAt: string;
  resolvedAt?: string;
}

export interface NodeReliabilityMetrics {
  nodeId: string;
  uptimePercent30d: number;
  jobCompletionRatePercent: number;
  slaViolationCount: number;
  compositeReliabilityScore: number;
  badge: ProviderReputationBadge;
}

export interface ReputationLeaderboardItem {
  providerId: string;
  providerEmail: string;
  totalNodes: number;
  reputationScore: number;
  badge: ProviderReputationBadge;
  totalCompletedJobs: number;
  uptimeAvgPercent: number;
}

export interface ReputationSummary {
  networkAvgReliability: number;
  eliteProviderCount: number;
  totalDisputesResolved: number;
  slaProtectionActivePercent: number;
  leaderboard: ReputationLeaderboardItem[];
  recentDisputes: DisputeRecord[];
}

export interface ApiKey {
  id: string;
  userId: string;
  name: string;
  keyPrefix: string;
  scopes: ApiKeyScope[];
  lastUsedAt?: string;
  createdAt: string;
}

export interface CreateApiKeyDto {
  name: string;
  scopes?: ApiKeyScope[];
}

export interface CreateApiKeyResponse {
  apiKey: ApiKey;
  rawSecretKey: string;
}

export interface HealthCheckResponse {
  status: 'ok' | 'degraded' | 'error';
  timestamp: string;
  version: string;
  uptimeSeconds: number;
  services: {
    database: 'connected' | 'disconnected' | 'mocked';
    redis: 'connected' | 'disconnected' | 'mocked';
    scheduler: 'active' | 'inactive';
  };
}
