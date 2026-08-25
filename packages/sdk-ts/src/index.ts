import {
  ComputeNode,
  CreateJobDto,
  Job,
  MarketplaceFilterDto,
  MarketplaceListResponse,
  UsageLedgerSummary,
  ReputationSummary,
} from '@distributed-compute/shared-types';

export interface ClientConfig {
  apiKey?: string;
  baseUrl?: string;
  timeoutMs?: number;
}

export class DistributedComputeClient {
  private readonly baseUrl: string;
  private readonly apiKey?: string;
  private readonly timeoutMs: number;

  public readonly nodes: NodesSubClient;
  public readonly workloads: WorkloadsSubClient;
  public readonly billing: BillingSubClient;
  public readonly reputation: ReputationSubClient;

  constructor(config: ClientConfig = {}) {
    this.baseUrl = config.baseUrl?.replace(/\/$/, '') || 'https://api.distributed.gpu/api/v1';
    this.apiKey = config.apiKey;
    this.timeoutMs = config.timeoutMs || 30000;

    this.nodes = new NodesSubClient(this);
    this.workloads = new WorkloadsSubClient(this);
    this.billing = new BillingSubClient(this);
    this.reputation = new ReputationSubClient(this);
  }

  async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'User-Agent': '@distributed-compute/sdk/0.1.0',
      ...(options.headers as Record<string, string>),
    };

    if (this.apiKey) {
      headers['Authorization'] = `Bearer ${this.apiKey}`;
      headers['x-api-key'] = this.apiKey;
    }

    const url = `${this.baseUrl}${path.startsWith('/') ? path : `/${path}`}`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(url, {
        ...options,
        headers,
        signal: controller.signal,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`[DistributedCompute SDK Error ${response.status}] ${errorText}`);
      }

      return (await response.json()) as T;
    } finally {
      clearTimeout(timer);
    }
  }
}

export class NodesSubClient {
  constructor(private readonly client: DistributedComputeClient) {}

  async list(filter: MarketplaceFilterDto = {}): Promise<MarketplaceListResponse> {
    const params = new URLSearchParams();
    if (filter.tier) params.append('tier', filter.tier);
    if (filter.gpuModel) params.append('gpuModel', filter.gpuModel);
    if (filter.minVramGb) params.append('minVramGb', filter.minVramGb.toString());
    if (filter.maxHourlyRateUsd) params.append('maxHourlyRateUsd', filter.maxHourlyRateUsd.toString());

    const qs = params.toString() ? `?${params.toString()}` : '';
    return this.client.request<MarketplaceListResponse>(`/marketplace/nodes${qs}`);
  }

  async get(nodeId: string): Promise<ComputeNode> {
    return this.client.request<ComputeNode>(`/marketplace/nodes/${nodeId}`);
  }
}

export class WorkloadsSubClient {
  constructor(private readonly client: DistributedComputeClient) {}

  async submit(dto: CreateJobDto): Promise<Job> {
    return this.client.request<Job>('/workloads/jobs', {
      method: 'POST',
      body: JSON.stringify(dto),
    });
  }

  async get(jobId: string): Promise<Job> {
    return this.client.request<Job>(`/workloads/jobs/${jobId}`);
  }

  async cancel(jobId: string): Promise<Job> {
    return this.client.request<Job>(`/workloads/jobs/${jobId}/cancel`, {
      method: 'POST',
    });
  }

  async getLogs(jobId: string): Promise<string[]> {
    const res = await this.client.request<{ logs: string[] }>(`/workloads/jobs/${jobId}/logs`);
    return res.logs;
  }
}

export class BillingSubClient {
  constructor(private readonly client: DistributedComputeClient) {}

  async getSummary(customerId: string): Promise<UsageLedgerSummary> {
    return this.client.request<UsageLedgerSummary>(`/billing/summary/${customerId}`);
  }
}

export class ReputationSubClient {
  constructor(private readonly client: DistributedComputeClient) {}

  async getSummary(): Promise<ReputationSummary> {
    return this.client.request<ReputationSummary>('/reputation/summary');
  }
}

export default DistributedComputeClient;
