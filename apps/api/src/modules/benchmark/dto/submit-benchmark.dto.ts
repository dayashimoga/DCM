import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsObject, IsString } from 'class-validator';
import { BenchmarkMetrics } from '@distributed-compute/shared-types';

export class SubmitBenchmarkDto {
  @ApiProperty({ example: 'node-8899-aabb', description: 'Registered Node ID' })
  @IsString()
  @IsNotEmpty()
  nodeId!: string;

  @ApiProperty({ description: 'Full benchmark metrics bundle' })
  @IsObject()
  @IsNotEmpty()
  metrics!: BenchmarkMetrics;

  @ApiProperty({ example: 'a1b2c3d4e5f6...', description: 'Cryptographic challenge signature' })
  @IsString()
  @IsNotEmpty()
  proofOfWorkSignature!: string;
}
