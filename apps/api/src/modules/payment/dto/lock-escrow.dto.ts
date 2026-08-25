import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class LockEscrowDto {
  @ApiProperty({ description: 'Job UUID' })
  @IsString()
  @IsNotEmpty()
  jobId: string;

  @ApiProperty({ description: 'Customer UUID' })
  @IsString()
  @IsNotEmpty()
  customerId: string;

  @ApiProperty({ description: 'Provider UUID' })
  @IsString()
  @IsNotEmpty()
  providerId: string;

  @ApiProperty({ description: 'Estimated budget to lock in escrow (USD)' })
  @Type(() => Number)
  @IsNumber()
  @Min(0.01)
  estimatedBudgetUsd: number;
}
