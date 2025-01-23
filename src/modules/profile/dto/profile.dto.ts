import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString } from 'class-validator';

export class CreateAlienDTO {
  @IsString()
  @ApiProperty()
  name: string;

  @IsString()
  @ApiProperty()
  element: string;

  // @IsString()
  // @ApiProperty()
  // image: Express.Multer.File;

  @IsNumber()
  @ApiProperty()
  strengthPoints: number;
}
