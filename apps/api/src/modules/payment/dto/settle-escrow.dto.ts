import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class SettleEscrowDto {
  @ApiProperty({ description: 'Job UUID' })
  @IsString()
  @IsNotEmpty()
  jobId: string;

  @ApiProperty({ description: 'Actual compute cost incurred (USD)' })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  actualCostUsd: number;
}
