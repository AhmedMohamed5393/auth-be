import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MinLength,
} from 'class-validator';

export class RegisterDto {
  @ApiProperty({
    example: 'Ahmed Mohamed',
    description: 'The name of the user',
    required: true,
  })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.trim())
  @MinLength(3)
  name: string;

  @ApiProperty({
    example: 'ahmedmohamedalex93@gmail.com',
    description: 'The email of the user',
    required: true,
  })
  @IsNotEmpty({ message: 'email_IS_REQUIRED' })
  @IsEmail({}, { message: 'email_IS_INVALID' })
  email: string;

  @ApiProperty({
    example: 'Hamada_5393',
    description: 'The password of the user',
    required: true,
  })
  @IsNotEmpty({ message: 'password_IS_REQUIRED' })
  @Matches(/^[\w!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]{8,16}$/, { message: 'password_IS_INVALID' })
  password: string;
}
