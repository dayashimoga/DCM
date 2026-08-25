import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsObject, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { SchedulingStrategy, SchedulingWeights } from '@distributed-compute/shared-types';

export class EvaluateScheduleDto {
  @ApiPropertyOptional({ enum: SchedulingStrategy, default: SchedulingStrategy.BEST_PRICE_PERFORMANCE })
  @IsEnum(SchedulingStrategy)
  @IsOptional()
  strategy?: SchedulingStrategy = SchedulingStrategy.BEST_PRICE_PERFORMANCE;

  @ApiPropertyOptional({ description: 'Custom multi-objective weights { costWeight, performanceWeight, reliabilityWeight }' })
  @IsObject()
  @IsOptional()
  weights?: SchedulingWeights;

  @ApiPropertyOptional({ description: 'Required number of dedicated GPUs', default: 1 })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  requiredGpus?: number = 1;

  @ApiPropertyOptional({ description: 'Minimum total VRAM in GB', default: 0 })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  minVramGb?: number = 0;

  @ApiPropertyOptional({ description: 'Budget hourly price ceiling in USD' })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  maxHourlyRateUsd?: number;

  @ApiPropertyOptional({ description: 'Preferred geographic region' })
  @IsString()
  @IsOptional()
  preferredRegion?: string;

  @ApiPropertyOptional({ description: 'Target node ID if pinning to specific node' })
  @IsString()
  @IsOptional()
  targetNodeId?: string;
}
