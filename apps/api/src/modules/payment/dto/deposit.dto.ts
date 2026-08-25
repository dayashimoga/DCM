import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { PaymentMethod } from '@distributed-compute/shared-types';

export class DepositDto {
  @ApiProperty({ description: 'User ID depositing funds' })
  @IsString()
  @IsNotEmpty()
  userId: string;

  @ApiProperty({ description: 'Deposit amount in USD', default: 50 })
  @Type(() => Number)
  @IsNumber()
  @Min(5)
  amountUsd: number;

  @ApiProperty({ enum: PaymentMethod, default: PaymentMethod.FIAT_STRIPE })
  @IsEnum(PaymentMethod)
  @IsOptional()
  method?: PaymentMethod = PaymentMethod.FIAT_STRIPE;

  @ApiPropertyOptional({ description: 'Blockchain transaction hash if crypto' })
  @IsString()
  @IsOptional()
  txHash?: string;
}
