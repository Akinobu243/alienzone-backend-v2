import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString } from 'class-validator';

export class CreateAlienDTO {
  @IsString()
  @ApiProperty()
  name: string;

  @IsString()
  @ApiProperty()
  elementId: string;

  @IsString()
  @ApiProperty()
  strengthPoints: string;
}
