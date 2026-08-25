import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { BillingService } from './billing.service';
import { UsageTickDto } from './dto/usage-tick.dto';
import { GenerateInvoiceDto } from './dto/generate-invoice.dto';
import { Public } from '../auth/decorators/public.decorator';
import {
  UsageLedgerSummary,
  ProviderEarningsSummary,
  Invoice,
  BalanceDeductionEvent,
} from '@distributed-compute/shared-types';

@ApiTags('Usage Metering & Billing')
@Controller('billing')
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  @Public()
  @Post('tick')
  @ApiOperation({ summary: 'Ingest real-time usage tick and deduct balance with over-usage protection' })
  @ApiResponse({ status: 200, description: 'Balance deduction event result' })
  async recordUsageTick(@Body() dto: UsageTickDto): Promise<BalanceDeductionEvent> {
    return this.billingService.recordUsageTick(dto);
  }

  @Public()
  @Get('usage/:customerId')
  @ApiOperation({ summary: 'Retrieve customer compute usage history and real-time burn rate' })
  @ApiResponse({ status: 200, description: 'Usage ledger summary' })
  async getCustomerUsage(@Param('customerId') customerId: string): Promise<UsageLedgerSummary> {
    return this.billingService.getCustomerUsage(customerId);
  }

  @Public()
  @Get('provider-earnings/:providerId')
  @ApiOperation({ summary: 'Retrieve provider compute earnings and 15% marketplace commission breakdown' })
  @ApiResponse({ status: 200, description: 'Provider earnings summary' })
  async getProviderEarnings(@Param('providerId') providerId: string): Promise<ProviderEarningsSummary> {
    return this.billingService.getProviderEarnings(providerId);
  }

  @Public()
  @Get('invoices/:userId')
  @ApiOperation({ summary: 'Generate itemized billing invoice statement' })
  @ApiResponse({ status: 200, description: 'Itemized invoice' })
  async generateInvoice(
    @Param('userId') userId: string,
    @Query() dto: GenerateInvoiceDto,
  ): Promise<Invoice> {
    return this.billingService.generateInvoice(userId, dto.periodDays);
  }

  @Public()
  @Post('credits/:userId')
  @ApiOperation({ summary: 'Add balance credits for customer testing / top-up' })
  @ApiResponse({ status: 200, description: 'Updated balance' })
  async addCredits(
    @Param('userId') userId: string,
    @Body('amountUsd') amountUsd: number,
  ): Promise<{ balanceUsd: number }> {
    return this.billingService.addMockCredits(userId, amountUsd || 50.0);
  }
}
