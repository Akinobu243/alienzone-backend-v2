import { ApiProperty } from "@nestjs/swagger";
import { IsNumber, IsString } from "class-validator";

export class CreateAlienDTO {
    @IsString()
    @ApiProperty()
    name: string;

    @IsString()
    @ApiProperty()
    element: string;

    @IsString()
    @ApiProperty()
    hair: string;

    @IsString()
    @ApiProperty()
    face: string;

    @IsString()
    @ApiProperty()
    eyes: string;

    @IsNumber()
    @ApiProperty()
    strengthPoints: number;
}