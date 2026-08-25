import {
  Controller,
  Get,
  Header,
  Res,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Response } from 'express';
import { MetricsService } from './metrics.service';
import { Public } from '../auth/decorators/public.decorator';
import {
  ObservabilitySummary,
  PlatformMetric,
} from '@distributed-compute/shared-types';

@ApiTags('Observability & Distributed Tracing')
@Controller()
export class MetricsController {
  constructor(private readonly metricsService: MetricsService) {}

  @Public()
  @Get('metrics')
  @Header('Content-Type', 'text/plain; version=0.0.4; charset=utf-8')
  @ApiOperation({ summary: 'Prometheus standard metrics exposition scrape endpoint' })
  @ApiResponse({ status: 200, description: 'Prometheus text exposition format' })
  async getPrometheusMetrics(@Res() res: Response): Promise<void> {
    const text = await this.metricsService.getPrometheusExposition();
    res.send(text);
  }

  @Public()
  @Get('api/v1/metrics/json')
  @ApiOperation({ summary: 'Get structured platform metrics as JSON' })
  @ApiResponse({ status: 200, description: 'Array of platform metrics' })
  async getJsonMetrics(): Promise<PlatformMetric[]> {
    return this.metricsService.getPlatformMetrics();
  }

  @Public()
  @Get('api/v1/metrics/summary')
  @ApiOperation({ summary: 'Get overall platform observability summary, RED metrics, and trace waterfall samples' })
  @ApiResponse({ status: 200, description: 'Observability summary' })
  async getObservabilitySummary(): Promise<ObservabilitySummary> {
    return this.metricsService.getObservabilitySummary();
  }
}
