import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WorkloadController } from '../src/modules/workload/workload.controller';
import { WorkloadService } from '../src/modules/workload/workload.service';
import { JobStatus, UserRole } from '@distributed-compute/shared-types';

describe('WorkloadController Unit Tests', () => {
  let controller: WorkloadController;
  let mockService: Partial<WorkloadService>;

  beforeEach(() => {
    mockService = {
      createJob: vi.fn().mockResolvedValue({
        id: 'job-101',
        customerId: 'user-1',
        nodeId: 'node-1',
        status: JobStatus.SCHEDULED,
        image: 'pytorch/pytorch:latest',
        totalGpuSeconds: 0,
        totalCostUsd: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }),
      getCustomerJobs: vi.fn().mockResolvedValue([
        {
          id: 'job-101',
          customerId: 'user-1',
          nodeId: 'node-1',
          status: JobStatus.RUNNING,
          image: 'pytorch/pytorch:latest',
          totalGpuSeconds: 120,
          totalCostUsd: 0.10,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ]),
      getJobDetails: vi.fn().mockResolvedValue({
        id: 'job-101',
        customerId: 'user-1',
        nodeId: 'node-1',
        status: JobStatus.RUNNING,
        image: 'pytorch/pytorch:latest',
        totalGpuSeconds: 120,
        totalCostUsd: 0.10,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }),
      cancelJob: vi.fn().mockResolvedValue({
        id: 'job-101',
        customerId: 'user-1',
        nodeId: 'node-1',
        status: JobStatus.CANCELLED,
        image: 'pytorch/pytorch:latest',
        totalGpuSeconds: 120,
        totalCostUsd: 0.10,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }),
      getJobLogs: vi.fn().mockResolvedValue(['Line 1', 'Line 2']),
      handleAgentStatusUpdate: vi.fn().mockResolvedValue({ acknowledged: true }),
      getPendingJobForNode: vi.fn().mockResolvedValue({
        id: 'job-101',
        customerId: 'user-1',
        nodeId: 'node-1',
        status: JobStatus.SCHEDULED,
        image: 'pytorch/pytorch:latest',
        totalGpuSeconds: 0,
        totalCostUsd: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }),
    };

    controller = new WorkloadController(mockService as WorkloadService);
  });

  it('should delegate createJob call', async () => {
    const user = { id: 'user-1', email: 'test@example.com', role: UserRole.CUSTOMER, balanceUsd: 100, createdAt: '' };
    const dto = { image: 'pytorch/pytorch:latest' };
    const res = await controller.createJob(user, dto);
    expect(res.id).toBe('job-101');
    expect(mockService.createJob).toHaveBeenCalledWith('user-1', dto);
  });

  it('should delegate getCustomerJobs call', async () => {
    const user = { id: 'user-1', email: 'test@example.com', role: UserRole.CUSTOMER, balanceUsd: 100, createdAt: '' };
    const res = await controller.getCustomerJobs(user);
    expect(res.length).toBe(1);
  });

  it('should delegate getJobLogs call', async () => {
    const res = await controller.getJobLogs('job-101');
    expect(res.logs.length).toBe(2);
  });

  it('should delegate updateAgentStatus call', async () => {
    const dto = { jobId: 'job-101', nodeId: 'node-1', status: JobStatus.RUNNING };
    const res = await controller.updateAgentStatus(dto);
    expect(res.acknowledged).toBe(true);
  });
});
