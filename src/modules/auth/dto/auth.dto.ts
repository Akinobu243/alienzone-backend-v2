import { User } from '@prisma/client';
import { IsEmail, IsNotEmpty, IsNumber, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';


export class AuthResponseDTO {
  walletAddress: string;
  accessToken: string;
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
}

export class RegisterUserDTO {
  @IsString()
  @ApiProperty()
  name: string;

  @IsString()
  @ApiProperty()
  country: string;

  @IsString()
  @ApiProperty()
  twitterId: string;

  @IsString()
  @ApiProperty()
  image: string;

  @ApiProperty()
  enterprise?: string | null;
}