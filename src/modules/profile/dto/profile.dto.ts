import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString } from 'class-validator';

export class CreateAlienDTO {
  @IsString()
  @ApiProperty()
  name: string;

  @IsNumber()
  @ApiProperty()
  elementId: number;

  @IsString()
  @ApiProperty()
  strengthPoints: string;
}
