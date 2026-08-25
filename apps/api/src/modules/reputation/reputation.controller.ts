import {
  Controller,
  Get,
  Post,
  Body,
  Param,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ReputationService } from './reputation.service';
import { CreateDisputeDto } from './dto/create-dispute.dto';
import { ArbitrateDisputeDto } from './dto/arbitrate-dispute.dto';
import { Public } from '../auth/decorators/public.decorator';
import {
  ReputationSummary,
  ReputationLeaderboardItem,
  NodeReliabilityMetrics,
  DisputeRecord,
} from '@distributed-compute/shared-types';

@ApiTags('Trust, Reputation & SLA Enforcement')
@Controller('reputation')
export class ReputationController {
  constructor(private readonly reputationService: ReputationService) {}

  @Public()
  @Get('summary')
  @ApiOperation({ summary: 'Get global network reputation summary, SLA protection score, and dispute stats' })
  @ApiResponse({ status: 200, description: 'Reputation summary' })
  async getSummary(): Promise<ReputationSummary> {
    return this.reputationService.getSummary();
  }

  @Public()
  @Get('leaderboard')
  @ApiOperation({ summary: 'Get top ranked providers by reliability and SLA track record' })
  @ApiResponse({ status: 200, description: 'Provider leaderboard' })
  async getLeaderboard(): Promise<ReputationLeaderboardItem[]> {
    return this.reputationService.getLeaderboard();
  }

  @Public()
  @Get('nodes/:nodeId')
  @ApiOperation({ summary: 'Get 30-day reliability and SLA metrics for a specific node' })
  @ApiResponse({ status: 200, description: 'Node reliability metrics' })
  async getNodeReliability(@Param('nodeId') nodeId: string): Promise<NodeReliabilityMetrics> {
    return this.reputationService.getNodeReliability(nodeId);
  }

  @Public()
  @Post('disputes')
  @ApiOperation({ summary: 'Submit a customer dispute claim for failed workload or SLA breach' })
  @ApiResponse({ status: 201, description: 'Dispute created' })
  async submitDispute(@Body() dto: CreateDisputeDto): Promise<DisputeRecord> {
    return this.reputationService.submitDispute('user-cust-default', dto);
  }

  @Public()
  @Post('disputes/:id/arbitrate')
  @ApiOperation({ summary: 'Execute automated dispute arbitration and escrow refund' })
  @ApiResponse({ status: 200, description: 'Dispute arbitrated' })
  async arbitrateDispute(
    @Param('id') id: string,
    @Body() dto: ArbitrateDisputeDto,
  ): Promise<DisputeRecord> {
    return this.reputationService.arbitrateDispute(id, dto);
  }
}
