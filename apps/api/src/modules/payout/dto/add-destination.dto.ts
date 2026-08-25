import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { PayoutDestinationType } from '@distributed-compute/shared-types';

export class AddDestinationDto {
  @ApiProperty({ description: 'Provider User ID' })
  @IsString()
  @IsNotEmpty()
  providerId: string;

  @ApiProperty({ enum: PayoutDestinationType, default: PayoutDestinationType.BANK_STRIPE_CONNECT })
  @IsEnum(PayoutDestinationType)
  type: PayoutDestinationType;

  @ApiProperty({ description: 'User-friendly label', example: 'Chase Business Checking' })
  @IsString()
  @IsNotEmpty()
  label: string;

  @ApiProperty({ description: 'IBAN / Routing / Wallet Address', example: 'US94 0000 0000 1234 5678' })
  @IsString()
  @IsNotEmpty()
  target: string;

  @ApiPropertyOptional({ description: 'Set as default payout destination', default: true })
  @IsBoolean()
  @IsOptional()
  isDefault?: boolean = true;
}
