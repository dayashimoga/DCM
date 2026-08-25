import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsNumber, IsObject, IsString } from 'class-validator';
import { NodeStatus, TelemetryMetrics } from '@distributed-compute/shared-types';

export class HeartbeatDto {
  @ApiProperty({ example: 'node-8899-aabb', description: 'Registered Node ID' })
  @IsString()
  @IsNotEmpty()
  nodeId!: string;

  @ApiProperty({ enum: NodeStatus, example: NodeStatus.ONLINE })
  @IsEnum(NodeStatus)
  @IsNotEmpty()
  status!: NodeStatus;

  @ApiProperty({ example: 1724580000.123, description: 'Epoch timestamp of heartbeat pulse' })
  @IsNumber()
  @IsNotEmpty()
  timestamp!: number;

  @ApiProperty({ description: 'Current hardware telemetry metrics' })
  @IsObject()
  @IsNotEmpty()
  metrics!: TelemetryMetrics;
}
