import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class UsageTickDto {
  @ApiProperty({ description: 'Job UUID' })
  @IsString()
  @IsNotEmpty()
  jobId: string;

  @ApiProperty({ description: 'Node ID executing the workload' })
  @IsString()
  @IsNotEmpty()
  nodeId: string;

  @ApiProperty({ description: 'Duration of the tick in seconds', default: 15 })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  durationSeconds: number;

  @ApiPropertyOptional({ description: 'CPU seconds used' })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  cpuSeconds?: number;

  @ApiPropertyOptional({ description: 'RAM GB seconds used' })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  ramGbSeconds?: number;
}
