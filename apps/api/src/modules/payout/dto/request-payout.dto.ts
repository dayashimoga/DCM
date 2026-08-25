import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { PayoutDestinationType } from '@distributed-compute/shared-types';

export class RequestPayoutDto {
  @ApiProperty({ description: 'Provider User ID' })
  @IsString()
  @IsNotEmpty()
  providerId: string;

  @ApiProperty({ description: 'Requested payout amount in USD (minimum $50.00)', default: 50.0 })
  @Type(() => Number)
  @IsNumber()
  @Min(50, { message: 'Minimum payout amount is $50.00' })
  amountUsd: number;

  @ApiProperty({ enum: PayoutDestinationType, default: PayoutDestinationType.BANK_STRIPE_CONNECT })
  @IsEnum(PayoutDestinationType)
  destinationType: PayoutDestinationType;

  @ApiPropertyOptional({ description: 'Saved destination ID or direct wallet address / bank ref' })
  @IsString()
  @IsOptional()
  destinationTarget?: string;
}
