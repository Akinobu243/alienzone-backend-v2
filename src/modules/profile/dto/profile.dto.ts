import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString } from 'class-validator';

export class CreateAlienDTO {
  @ApiProperty()
  name: string;

  @ApiProperty()
  element: string;

  @ApiProperty()
  strengthPoints: string;
}
