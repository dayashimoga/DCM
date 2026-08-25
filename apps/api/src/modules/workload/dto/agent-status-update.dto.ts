import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsEnum, IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { JobStatus } from '@distributed-compute/shared-types';

export class AgentJobStatusUpdateDto {
  @ApiProperty({ description: 'Job UUID' })
  @IsString()
  @IsNotEmpty()
  jobId: string;

  @ApiProperty({ description: 'Reporting Node ID' })
  @IsString()
  @IsNotEmpty()
  nodeId: string;

  @ApiProperty({ enum: JobStatus, description: 'Updated state machine status' })
  @IsEnum(JobStatus)
  @IsNotEmpty()
  status: JobStatus;

  @ApiPropertyOptional({ description: 'Process exit code (0 for success, >0 for errors)' })
  @IsInt()
  @IsOptional()
  exitCode?: number;

  @ApiPropertyOptional({ description: 'Error message or exception trace if failed' })
  @IsString()
  @IsOptional()
  errorReason?: string;

  @ApiPropertyOptional({ description: 'Chunk of stdout/stderr log lines to append' })
  @IsArray()
  @IsOptional()
  logs?: string[];
}
