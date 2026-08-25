import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { WorkloadService } from './workload.service';
import { CreateJobDto } from './dto/create-job.dto';
import { AgentJobStatusUpdateDto } from './dto/agent-status-update.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Job, UserProfile } from '@distributed-compute/shared-types';

@ApiTags('Workload Submission & Execution')
@Controller('workloads')
export class WorkloadController {
  constructor(private readonly workloadService: WorkloadService) {}

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('jobs')
  @ApiOperation({ summary: 'Submit a containerized AI/ML compute job' })
  @ApiResponse({ status: 201, description: 'Job created and scheduled' })
  async createJob(
    @CurrentUser() user: UserProfile,
    @Body() dto: CreateJobDto,
  ): Promise<Job> {
    return this.workloadService.createJob(user.id, dto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('jobs')
  @ApiOperation({ summary: 'Get list of submitted compute jobs for authenticated customer' })
  @ApiResponse({ status: 200, description: 'Customer jobs list' })
  async getCustomerJobs(@CurrentUser() user: UserProfile): Promise<Job[]> {
    return this.workloadService.getCustomerJobs(user.id);
  }

  @Public()
  @Get('jobs/:jobId')
  @ApiOperation({ summary: 'Get detailed job execution status and metrics' })
  @ApiResponse({ status: 200, description: 'Job details' })
  async getJobDetails(@Param('jobId') jobId: string): Promise<Job> {
    return this.workloadService.getJobDetails(jobId);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('jobs/:jobId/cancel')
  @ApiOperation({ summary: 'Cancel a running or scheduled compute job' })
  @ApiResponse({ status: 200, description: 'Job cancelled' })
  async cancelJob(
    @CurrentUser() user: UserProfile,
    @Param('jobId') jobId: string,
  ): Promise<Job> {
    return this.workloadService.cancelJob(jobId, user.id);
  }

  @Public()
  @Get('jobs/:jobId/logs')
  @ApiOperation({ summary: 'Retrieve execution stdout/stderr logs for a job' })
  @ApiResponse({ status: 200, description: 'Array of log lines' })
  async getJobLogs(@Param('jobId') jobId: string): Promise<{ logs: string[] }> {
    const logs = await this.workloadService.getJobLogs(jobId);
    return { logs };
  }

  @Public()
  @Post('agent/status')
  @ApiOperation({ summary: 'Provider Agent status transition and log buffer ingestion endpoint' })
  @ApiResponse({ status: 200, description: 'Status acknowledged' })
  async updateAgentStatus(@Body() dto: AgentJobStatusUpdateDto): Promise<{ acknowledged: boolean }> {
    return this.workloadService.handleAgentStatusUpdate(dto);
  }

  @Public()
  @Get('agent/pending/:nodeId')
  @ApiOperation({ summary: 'Poll pending assigned jobs for a specific provider node' })
  @ApiResponse({ status: 200, description: 'Assigned job or null' })
  async getPendingJob(@Param('nodeId') nodeId: string): Promise<Job | null> {
    return this.workloadService.getPendingJobForNode(nodeId);
  }
}
