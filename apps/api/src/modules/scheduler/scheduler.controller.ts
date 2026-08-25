import {
  Controller,
  Post,
  Get,
  Body,
  Param,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { SchedulerService } from './scheduler.service';
import { EvaluateScheduleDto } from './dto/evaluate-schedule.dto';
import { ScheduleJobDto } from './dto/schedule-job.dto';
import { Public } from '../auth/decorators/public.decorator';
import {
  SchedulingDecision,
  FailoverEvent,
} from '@distributed-compute/shared-types';

@ApiTags('Intelligent Multi-Objective Scheduler')
@Controller('scheduler')
export class SchedulerController {
  constructor(private readonly schedulerService: SchedulerService) {}

  @Public()
  @Post('evaluate')
  @ApiOperation({ summary: 'Simulate candidate ranking and composite scoring for a workload' })
  @ApiResponse({ status: 200, description: 'Evaluation decision with ranked candidate breakdown' })
  async evaluateCandidates(@Body() dto: EvaluateScheduleDto): Promise<SchedulingDecision> {
    return this.schedulerService.evaluateCandidates(dto);
  }

  @Public()
  @Post('schedule')
  @ApiOperation({ summary: 'Execute multi-objective placement and dispatch job to optimal node' })
  @ApiResponse({ status: 200, description: 'Job placed and assigned to node' })
  async scheduleJob(@Body() dto: ScheduleJobDto): Promise<SchedulingDecision> {
    return this.schedulerService.scheduleJob(dto);
  }

  @Public()
  @Post('failover/:nodeId')
  @ApiOperation({ summary: 'Reconcile and failover active jobs from an unresponsive node' })
  @ApiResponse({ status: 200, description: 'List of failover migration events' })
  async triggerFailover(@Param('nodeId') nodeId: string): Promise<FailoverEvent[]> {
    return this.schedulerService.handleNodeFailover(nodeId);
  }

  @Public()
  @Get('decisions/:jobId')
  @ApiOperation({ summary: 'Retrieve scheduling decision explanation and scoring breakdown' })
  @ApiResponse({ status: 200, description: 'Scheduling decision audit log' })
  async getDecision(@Param('jobId') jobId: string): Promise<SchedulingDecision | null> {
    return this.schedulerService.getDecisionForJob(jobId);
  }
}
