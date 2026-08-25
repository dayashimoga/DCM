import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsNumber, IsPositive, IsString } from 'class-validator';
import { DisputeReason } from '@distributed-compute/shared-types';

export class CreateDisputeDto {
  @ApiProperty({ description: 'Job ID subject to SLA violation claim' })
  @IsString()
  @IsNotEmpty()
  jobId: string;

  @ApiProperty({ enum: DisputeReason, default: DisputeReason.PREMATURE_TERMINATION })
  @IsEnum(DisputeReason)
  reason: DisputeReason;

  @ApiProperty({ description: 'Detailed explanation of failure or mismatch' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ description: 'Claimed refund amount in USD', example: 15.5 })
  @IsNumber()
  @IsPositive()
  claimAmountUsd: number;
}
