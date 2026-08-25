import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class GenerateInvoiceDto {
  @ApiPropertyOptional({ description: 'Invoice period in days', default: 30 })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @IsOptional()
  periodDays?: number = 30;
}
