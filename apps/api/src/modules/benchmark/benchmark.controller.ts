import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { BenchmarkService } from './benchmark.service';
import { SubmitBenchmarkDto } from './dto/submit-benchmark.dto';
import { Public } from '../auth/decorators/public.decorator';
import {
  BenchmarkVerificationResult,
  ComputeTierInfo,
} from '@distributed-compute/shared-types';

@ApiTags('Hardware Discovery & Benchmarks')
@Controller('benchmarks')
export class BenchmarkController {
  constructor(private readonly benchmarkService: BenchmarkService) {}

  @Public()
  @Post('submit')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Submit synthetic benchmark & anti-spoofing challenge results for node verification' })
  @ApiResponse({ status: 200, description: 'Benchmark verified and score certified' })
  @ApiResponse({ status: 400, description: 'Invalid challenge signature or metrics' })
  @ApiResponse({ status: 404, description: 'Node not found' })
  async submitBenchmark(@Body() dto: SubmitBenchmarkDto): Promise<BenchmarkVerificationResult> {
    return this.benchmarkService.submitAndVerifyBenchmark(dto);
  }

  @Public()
  @Get('tiers')
  @ApiOperation({ summary: 'Get standardized Compute Tier definitions and score boundaries' })
  @ApiResponse({ status: 200, description: 'List of all compute tiers with target score ranges' })
  getTiers(): ComputeTierInfo[] {
    return this.benchmarkService.getComputeTiers();
  }

  @Public()
  @Get('node/:nodeId')
  @ApiOperation({ summary: 'Get certified benchmark verification results for a specific node' })
  @ApiResponse({ status: 200, description: 'Node benchmark verification certificate' })
  @ApiResponse({ status: 404, description: 'Node not found' })
  async getNodeBenchmark(@Param('nodeId') nodeId: string): Promise<BenchmarkVerificationResult> {
    return this.benchmarkService.getNodeBenchmark(nodeId);
  }
}
