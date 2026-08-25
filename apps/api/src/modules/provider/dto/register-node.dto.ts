import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsObject, IsOptional, IsString, IsNumber } from 'class-validator';
import { HardwareProfile } from '@distributed-compute/shared-types';

export class RegisterNodeDto {
  @ApiProperty({ description: 'Node pairing token obtained from Provider Dashboard' })
  @IsString()
  @IsNotEmpty()
  pairingToken!: string;

  @ApiProperty({ example: 'US-East-H100-Fleet-01', required: false })
  @IsString()
  @IsOptional()
  nodeName?: string;

  @ApiProperty({ description: 'Discovered hardware profile (CPU, GPU, RAM, Disk)' })
  @IsObject()
  @IsNotEmpty()
  hardware!: HardwareProfile;

  @ApiProperty({ example: 2.50, description: 'Provider custom hourly pricing in USD', required: false })
  @IsNumber()
  @IsOptional()
  hourlyRateUsd?: number;
}
