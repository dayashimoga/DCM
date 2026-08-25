import {
  Controller,
  Get,
  Post,
  Body,
  Param,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { PaymentService } from './payment.service';
import { DepositDto } from './dto/deposit.dto';
import { LockEscrowDto } from './dto/lock-escrow.dto';
import { SettleEscrowDto } from './dto/settle-escrow.dto';
import { Public } from '../auth/decorators/public.decorator';
import {
  WalletSummary,
  WalletTransaction,
  EscrowHold,
} from '@distributed-compute/shared-types';

@ApiTags('Payments, Wallets & Escrow')
@Controller('payments')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Public()
  @Get('wallet/:userId')
  @ApiOperation({ summary: 'Retrieve customer/provider wallet summary, balances, crypto addresses, and transaction history' })
  @ApiResponse({ status: 200, description: 'Wallet summary' })
  async getWalletSummary(@Param('userId') userId: string): Promise<WalletSummary> {
    return this.paymentService.getWalletSummary(userId);
  }

  @Public()
  @Post('deposit')
  @ApiOperation({ summary: 'Process multi-rail payment deposit (Fiat/Stripe or Crypto)' })
  @ApiResponse({ status: 200, description: 'Deposit transaction record' })
  async processDeposit(@Body() dto: DepositDto): Promise<WalletTransaction> {
    return this.paymentService.processDeposit(dto);
  }

  @Public()
  @Post('escrows/lock')
  @ApiOperation({ summary: 'Lock estimated workload budget in Escrow Hold' })
  @ApiResponse({ status: 200, description: 'Escrow hold contract created' })
  async lockEscrow(@Body() dto: LockEscrowDto): Promise<EscrowHold> {
    return this.paymentService.lockEscrow(dto);
  }

  @Public()
  @Post('escrows/settle')
  @ApiOperation({ summary: 'Settle escrow hold on workload completion and refund unused buffer' })
  @ApiResponse({ status: 200, description: 'Escrow contract settled' })
  async settleEscrow(@Body() dto: SettleEscrowDto): Promise<EscrowHold> {
    return this.paymentService.settleEscrow(dto);
  }

  @Public()
  @Post('escrows/:jobId/refund')
  @ApiOperation({ summary: 'Fully refund escrow hold on failed or cancelled workload' })
  @ApiResponse({ status: 200, description: 'Escrow contract refunded' })
  async refundEscrow(
    @Param('jobId') jobId: string,
    @Body('reason') reason: string,
  ): Promise<EscrowHold> {
    return this.paymentService.refundEscrow(jobId, reason || 'Job cancelled');
  }
}
