import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'developer@example.com', description: 'Registered user email address' })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsNotEmpty()
  email!: string;

  @ApiProperty({ example: 'SuperSecurePassword123!', description: 'User password' })
  @IsString()
  @IsNotEmpty()
  password!: string;
}
