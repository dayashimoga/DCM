import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';
import { EvaluateScheduleDto } from './evaluate-schedule.dto';

export class ScheduleJobDto extends EvaluateScheduleDto {
  @ApiProperty({ description: 'Job UUID to schedule' })
  @IsString()
  @IsNotEmpty()
  jobId: string;
}
