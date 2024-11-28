import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreatePostDTO {
  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  title: string;

  @IsString()
  @IsOptional()
  @ApiProperty({ required: false })
  content?: string;
}

export class UpdatePostDTO {
  @IsString()
  @IsOptional()
  @ApiProperty({ required: false })
  title?: string;

  @IsString()
  @IsOptional()
  @ApiProperty({ required: false })
  content?: string;

  @IsString()
  @IsOptional()
  @ApiProperty({ required: false })
  published?: boolean;
}

export class FilterPostsDTO {
  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  searchString: string;
}
