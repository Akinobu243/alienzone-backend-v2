import { User } from '@prisma/client';
import {
  IsEmail,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AuthResponseDTO {
  walletAddress: string;
  accessToken: string;
}

export class RegisterUserDTO {
  @IsString()
  @ApiProperty()
  name: string;

  @IsString()
  @ApiProperty()
  country: string;

  @IsOptional()
  @ApiProperty()
  twitterId?: string;

  @IsOptional()
  @ApiProperty()
  image?: string;

  @IsOptional()
  @ApiProperty()
  enterprise?: string;

  @IsOptional()
  @ApiProperty()
  referrerCode?: string;
}

export class AuthUserDTO {
  @IsString()
  @ApiProperty()
  signature?: string;

  @IsString()
  @ApiProperty()
  signedMessage?: string;

  @IsString()
  @ApiProperty()
  accessToken?: string;

  @IsOptional()
  @ApiPropertyOptional()
  register?: RegisterUserDTO;
}
