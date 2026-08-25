import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsNotEmpty, IsString, MinLength } from 'class-validator';
import { UserRole } from '@distributed-compute/shared-types';

export class RegisterDto {
  @ApiProperty({ example: 'developer@example.com', description: 'Unique user email address' })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsNotEmpty()
  email!: string;

  @ApiProperty({ example: 'SuperSecurePassword123!', description: 'User password (min 8 characters)' })
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @IsNotEmpty()
  password!: string;

  @ApiProperty({ enum: UserRole, example: UserRole.CUSTOMER, description: 'Account role (CUSTOMER or PROVIDER)' })
  @IsEnum(UserRole, { message: 'Role must be either CUSTOMER or PROVIDER' })
  @IsNotEmpty()
  role!: UserRole;
}
