import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SchedulerController } from '../src/modules/scheduler/scheduler.controller';
import { SchedulerService } from '../src/modules/scheduler/scheduler.service';
import { SchedulingStrategy } from '@distributed-compute/shared-types';

describe('SchedulerController Unit Tests', () => {
  let controller: SchedulerController;
  let mockService: Partial<SchedulerService>;

  beforeEach(() => {
    mockService = {
      evaluateCandidates: vi.fn().mockResolvedValue({
        strategy: SchedulingStrategy.BEST_PRICE_PERFORMANCE,
        selectedNodeId: 'node-101',
        selectedNodeName: 'H100-Rack',
        estimatedHourlyCostUsd: 2.50,
        compositeScore: 0.94,
        totalCandidateCount: 5,
        reason: 'Optimal score',
        rankedCandidates: [],
        timestamp: new Date().toISOString(),
      }),
      scheduleJob: vi.fn().mockResolvedValue({
        jobId: 'job-101',
        strategy: SchedulingStrategy.BEST_PRICE_PERFORMANCE,
        selectedNodeId: 'node-101',
        selectedNodeName: 'H100-Rack',
        estimatedHourlyCostUsd: 2.50,
        compositeScore: 0.94,
        totalCandidateCount: 5,
        reason: 'Optimal score',
        rankedCandidates: [],
        timestamp: new Date().toISOString(),
      }),
      handleNodeFailover: vi.fn().mockResolvedValue([
        {
          jobId: 'job-101',
          failedNodeId: 'node-fail',
          targetNodeId: 'node-new',
          reason: 'Migrated',
          timestamp: new Date().toISOString(),
        },
      ]),
      getDecisionForJob: vi.fn().mockResolvedValue({
        jobId: 'job-101',
        strategy: SchedulingStrategy.BEST_PRICE_PERFORMANCE,
        selectedNodeId: 'node-101',
        selectedNodeName: 'H100-Rack',
        estimatedHourlyCostUsd: 2.50,
        compositeScore: 0.94,
        totalCandidateCount: 5,
        reason: 'Optimal score',
        rankedCandidates: [],
        timestamp: new Date().toISOString(),
      }),
    };

    controller = new SchedulerController(mockService as SchedulerService);
  });

  it('should delegate evaluateCandidates call', async () => {
    const dto = { strategy: SchedulingStrategy.CHEAPEST, requiredGpus: 1 };
    const res = await controller.evaluateCandidates(dto);
    expect(res.selectedNodeId).toBe('node-101');
    expect(mockService.evaluateCandidates).toHaveBeenCalledWith(dto);
  });

  it('should delegate scheduleJob call', async () => {
    const dto = { jobId: 'job-101', strategy: SchedulingStrategy.CHEAPEST };
    const res = await controller.scheduleJob(dto);
    expect(res.jobId).toBe('job-101');
  });

  it('should delegate triggerFailover call', async () => {
    const res = await controller.triggerFailover('node-fail');
    expect(res.length).toBe(1);
  });

  it('should delegate getDecision call', async () => {
    const res = await controller.getDecision('job-101');
    expect(res?.jobId).toBe('job-101');
  });
});
