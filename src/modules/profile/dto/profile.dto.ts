import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

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

  @IsString()
  @ApiProperty()
  faceId: string;

  @IsString()
  @ApiProperty()
  hairId: string;
}
