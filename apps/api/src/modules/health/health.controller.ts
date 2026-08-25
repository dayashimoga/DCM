import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { HealthService } from './health.service';
import { HealthCheckResponse } from '@distributed-compute/shared-types';

@ApiTags('Health & Telemetry')
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  @ApiOperation({ summary: 'Platform Health and Readiness Probe' })
  @ApiResponse({ status: 200, description: 'Health check response payload' })
  async getHealth(): Promise<HealthCheckResponse> {
    return this.healthService.checkHealth();
  }
}
