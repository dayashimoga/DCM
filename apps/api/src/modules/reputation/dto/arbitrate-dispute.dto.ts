import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { DisputeStatus } from '@distributed-compute/shared-types';

export class ArbitrateDisputeDto {
  @ApiProperty({ enum: DisputeStatus, default: DisputeStatus.RESOLVED_REFUNDED })
  @IsEnum(DisputeStatus)
  status: DisputeStatus;

  @ApiProperty({ description: 'Arbitrator reasoning and log findings' })
  @IsString()
  @IsNotEmpty()
  arbitrationNotes: string;

  @ApiProperty({ description: 'Amount refunded to customer USD (if accepted)' })
  @IsNumber()
  @IsOptional()
  refundedAmountUsd?: number;
}
