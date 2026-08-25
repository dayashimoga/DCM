import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiKeyScope } from '@distributed-compute/shared-types';

export class CreateApiKeyDto {
  @ApiProperty({ description: 'Descriptive name for API token', example: 'Production Training Pipeline' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ enum: ApiKeyScope, isArray: true, default: [ApiKeyScope.WORKLOADS_ALL, ApiKeyScope.NODES_READ] })
  @IsArray()
  @IsEnum(ApiKeyScope, { each: true })
  @IsOptional()
  scopes?: ApiKeyScope[];
}
