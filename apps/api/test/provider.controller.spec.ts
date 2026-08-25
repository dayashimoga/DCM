import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ProviderController } from '../src/modules/provider/provider.controller';
import { ProviderService } from '../src/modules/provider/provider.service';
import { NodeStatus, UserRole } from '@distributed-compute/shared-types';

describe('ProviderController Unit Tests', () => {
  let controller: ProviderController;
  let mockProviderService: Partial<ProviderService>;

  beforeEach(() => {
    mockProviderService = {
      generatePairingToken: vi.fn().mockResolvedValue({
        pairingToken: 'ptk_test_123',
        providerId: 'prov-1',
        expiresInSeconds: 3600,
        quickstartCommand: 'podman run ...',
      }),
      registerNode: vi.fn().mockResolvedValue({
        nodeId: 'node-101',
        status: NodeStatus.ONLINE,
        apiKey: 'node_key_123',
        heartbeatIntervalSeconds: 15,
      }),
      processHeartbeat: vi.fn().mockResolvedValue({
        status: 'ACK',
        pendingJobId: null,
        timestamp: new Date().toISOString(),
      }),
      getProviderNodes: vi.fn().mockResolvedValue([
        {
          id: 'node-101',
          providerId: 'prov-1',
          name: 'H100-US-East',
          status: NodeStatus.ONLINE,
          cpu: { model: 'AMD EPYC', cores: 64, threads: 128 },
          gpus: [{ model: 'NVIDIA H100', vendor: 'NVIDIA', vramGb: 80, count: 1 }],
          ramGb: 256,
          diskGb: 2000,
          hourlyRateUsd: 2.5,
          benchmarkScore: 950,
          reliabilityScore: 99.8,
          lastHeartbeat: '',
          createdAt: '',
        },
      ]),
    };

    controller = new ProviderController(mockProviderService as ProviderService);
  });

  it('should delegate generatePairingToken call', async () => {
    const res = await controller.generatePairingToken({
      id: 'usr-1',
      email: 'prov@example.com',
      role: UserRole.PROVIDER,
      balanceUsd: 0,
      createdAt: '',
    });
    expect(res.pairingToken).toBe('ptk_test_123');
    expect(mockProviderService.generatePairingToken).toHaveBeenCalledWith('usr-1');
  });

  it('should delegate registerNode call', async () => {
    const dto = {
      pairingToken: 'ptk_test_123',
      hardware: {
        cpu: { model: 'AMD', cores: 32, threads: 64 },
        gpus: [],
        memory: { totalRamGb: 64 },
        storage: { totalDiskGb: 1000 },
      },
    };
    const res = await controller.registerNode(dto);
    expect(res.nodeId).toBe('node-101');
    expect(mockProviderService.registerNode).toHaveBeenCalledWith(dto);
  });

  it('should delegate heartbeat call', async () => {
    const dto = {
      nodeId: 'node-101',
      status: NodeStatus.ONLINE,
      timestamp: Date.now(),
      metrics: {
        cpuUsagePercent: 10,
        ramUsagePercent: 20,
        ramUsedGb: 8,
        gpuUtilizationPercent: 0,
        gpuTemperatureCelsius: 35,
      },
    };
    const res = await controller.heartbeat(dto);
    expect(res.status).toBe('ACK');
    expect(mockProviderService.processHeartbeat).toHaveBeenCalledWith(dto);
  });

  it('should delegate getNodes call', async () => {
    const res = await controller.getNodes({
      id: 'usr-1',
      email: 'prov@example.com',
      role: UserRole.PROVIDER,
      balanceUsd: 0,
      createdAt: '',
    });
    expect(res.length).toBe(1);
    expect(res[0].name).toBe('H100-US-East');
    expect(mockProviderService.getProviderNodes).toHaveBeenCalledWith('usr-1');
  });
});
