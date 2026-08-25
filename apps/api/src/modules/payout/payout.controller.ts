import {
  Controller,
  Get,
  Post,
  Body,
  Param,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { PayoutService } from './payout.service';
import { RequestPayoutDto } from './dto/request-payout.dto';
import { AddDestinationDto } from './dto/add-destination.dto';
import { Public } from '../auth/decorators/public.decorator';
import {
  ProviderEarningsAnalytics,
  PayoutRequest,
  PayoutDestination,
} from '@distributed-compute/shared-types';

@ApiTags('Provider Payouts & Earnings')
@Controller('payouts')
export class PayoutController {
  constructor(private readonly payoutService: PayoutService) {}

  @Public()
  @Get('analytics/:providerId')
  @ApiOperation({ summary: 'Get provider earnings breakdown, ROI yield forecast, and payout history' })
  @ApiResponse({ status: 200, description: 'Provider earnings analytics' })
  async getEarningsAnalytics(@Param('providerId') providerId: string): Promise<ProviderEarningsAnalytics> {
    return this.payoutService.getEarningsAnalytics(providerId);
  }

  @Public()
  @Post('request')
  @ApiOperation({ summary: 'Request on-demand earnings payout to bank or crypto wallet' })
  @ApiResponse({ status: 200, description: 'Payout request result' })
  async requestPayout(@Body() dto: RequestPayoutDto): Promise<PayoutRequest> {
    return this.payoutService.requestPayout(dto);
  }

  @Public()
  @Post('destinations')
  @ApiOperation({ summary: 'Add a new bank or crypto payout destination' })
  @ApiResponse({ status: 200, description: 'Destination added' })
  async addDestination(@Body() dto: AddDestinationDto): Promise<PayoutDestination> {
    return this.payoutService.addDestination(dto);
  }
}
