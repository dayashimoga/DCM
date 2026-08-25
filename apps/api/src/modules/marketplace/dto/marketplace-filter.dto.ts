import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ComputeTier, SortByOption } from '@distributed-compute/shared-types';

export class MarketplaceFilterDto {
  @ApiPropertyOptional({ description: 'Text search query matching GPU model, node name, or CPU' })
  @IsString()
  @IsOptional()
  searchQuery?: string;

  @ApiPropertyOptional({ enum: ComputeTier, description: 'Filter by compute tier' })
  @IsEnum(ComputeTier)
  @IsOptional()
  tier?: ComputeTier;

  @ApiPropertyOptional({ description: 'Filter by exact or partial GPU model name' })
  @IsString()
  @IsOptional()
  gpuModel?: string;

  @ApiPropertyOptional({ description: 'Minimum GPU VRAM in GB', example: 24 })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  minVramGb?: number;

  @ApiPropertyOptional({ description: 'Maximum hourly price ceiling in USD', example: 5.00 })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  maxHourlyRateUsd?: number;

  @ApiPropertyOptional({ description: 'Minimum certified benchmark score (1-1000)', example: 500 })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  minBenchmarkScore?: number;

  @ApiPropertyOptional({ description: 'Geographic region (e.g. US-East, EU-Central, AP-South)' })
  @IsString()
  @IsOptional()
  region?: string;

  @ApiPropertyOptional({ enum: SortByOption, default: SortByOption.PRICE_ASC })
  @IsEnum(SortByOption)
  @IsOptional()
  sortBy?: SortByOption = SortByOption.PRICE_ASC;

  @ApiPropertyOptional({ default: 1 })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @IsOptional()
  page?: number = 1;

  @ApiPropertyOptional({ default: 20 })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @IsOptional()
  limit?: number = 20;
}
