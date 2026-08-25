import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsObject, IsOptional, IsString } from 'class-validator';
import { SecurityEventType, SecuritySeverity } from '@distributed-compute/shared-types';

export class ReportSecurityEventDto {
  @ApiProperty({ enum: SecurityEventType, default: SecurityEventType.RESTRICTED_SYSCALL_BLOCKED })
  @IsEnum(SecurityEventType)
  type: SecurityEventType;

  @ApiProperty({ enum: SecuritySeverity, default: SecuritySeverity.HIGH })
  @IsEnum(SecuritySeverity)
  severity: SecuritySeverity;

  @ApiProperty({ description: 'Source subsystem emitting event', default: 'PROVIDER_SANDBOX' })
  @IsString()
  @IsNotEmpty()
  source: 'API_GATEWAY' | 'PROVIDER_SANDBOX' | 'SCHEDULER' | 'BENCHMARK';

  @ApiProperty({ description: 'Target entity (Job ID, Node ID, User ID)' })
  @IsString()
  @IsNotEmpty()
  targetId: string;

  @ApiPropertyOptional({ description: 'Event payload details' })
  @IsObject()
  @IsOptional()
  details?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Automated mitigation applied' })
  @IsString()
  @IsOptional()
  mitigation?: string;
}
