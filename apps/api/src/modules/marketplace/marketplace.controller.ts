import {
  Controller,
  Get,
  Param,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { MarketplaceService } from './marketplace.service';
import { MarketplaceFilterDto } from './dto/marketplace-filter.dto';
import { Public } from '../auth/decorators/public.decorator';
import {
  MarketplaceListResponse,
  MarketplaceSummary,
  ComputeNode,
} from '@distributed-compute/shared-types';

@ApiTags('Marketplace Discovery & Catalog')
@Controller('marketplace')
export class MarketplaceController {
  constructor(private readonly marketplaceService: MarketplaceService) {}

  @Public()
  @Get('nodes')
  @ApiOperation({ summary: 'Search and filter active GPU/CPU compute nodes with pagination and sorting' })
  @ApiResponse({ status: 200, description: 'Paginated list of available compute nodes' })
  async searchNodes(@Query() filter: MarketplaceFilterDto): Promise<MarketplaceListResponse> {
    return this.marketplaceService.searchNodes(filter);
  }

  @Public()
  @Get('summary')
  @ApiOperation({ summary: 'Get network-wide compute availability, total VRAM, and price statistics' })
  @ApiResponse({ status: 200, description: 'Aggregated network compute statistics' })
  async getSummary(): Promise<MarketplaceSummary> {
    return this.marketplaceService.getMarketplaceSummary();
  }

  @Public()
  @Get('nodes/:nodeId')
  @ApiOperation({ summary: 'Get detailed compute node specification and real-time telemetry' })
  @ApiResponse({ status: 200, description: 'Detailed compute node profile' })
  @ApiResponse({ status: 404, description: 'Node not found' })
  async getNodeDetails(@Param('nodeId') nodeId: string): Promise<ComputeNode> {
    return this.marketplaceService.getNodeDetails(nodeId);
  }
}
