import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsNotEmpty, IsObject, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { SchedulingStrategy } from '@distributed-compute/shared-types';

export class CreateJobDto {
  @ApiProperty({ description: 'OCI / Docker image name', example: 'nvidia/cuda:12.2.0-base-ubuntu22.04' })
  @IsString()
  @IsNotEmpty()
  image: string;

  @ApiPropertyOptional({ description: 'Entrypoint command or bash script', example: 'python train.py --epochs 10' })
  @IsString()
  @IsOptional()
  command?: string;

  @ApiPropertyOptional({ description: 'Environment variables key-value map', example: { BATCH_SIZE: '64', LEARNING_RATE: '0.001' } })
  @IsObject()
  @IsOptional()
  env?: Record<string, string>;

  @ApiPropertyOptional({ description: 'Number of dedicated GPUs requested', example: 1, default: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @IsOptional()
  gpuCount?: number = 1;

  @ApiPropertyOptional({ description: 'Minimum VRAM required in GB', example: 24 })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @IsOptional()
  minVramGb?: number;

  @ApiPropertyOptional({ description: 'Specific compute node ID to rent directly' })
  @IsString()
  @IsOptional()
  nodeId?: string;

  @ApiPropertyOptional({ enum: SchedulingStrategy, default: SchedulingStrategy.CHEAPEST })
  @IsEnum(SchedulingStrategy)
  @IsOptional()
  strategy?: SchedulingStrategy = SchedulingStrategy.CHEAPEST;

  @ApiPropertyOptional({ description: 'Maximum job execution duration in minutes before timeout', default: 60 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  maxDurationMinutes?: number = 60;
}
