import {
  Body,
  Controller,
  Get,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { AdminGuard } from '../auth/guards/admin.guard';
import { CharacterService } from './character.service';
import { AuthGuard } from '../auth/guards/auth.guard';
import { CharacterRarity, CharacterType } from '@prisma/client';

@ApiTags('character')
@Controller('/character')
export class CharacterController {
  constructor(private characterService: CharacterService) {}

  @UseGuards(AdminGuard)
  @Post('/create-character')
  async createCharacter(
    @Body('name') name: string,
    @Body('type') type: CharacterType,
    @Body('rarity') rarity: CharacterRarity,
    @Body('power') power: number,
    @Body('image') image: string,
  ) {
    power = parseInt(power.toString());
    return this.characterService.createCharacter(
      name,
      type,
      rarity,
      power,
      image,
    );
  }

  @UseGuards(AdminGuard)
  @Post('/edit-character')
  async editCharacter(
    @Body('id') id: number,
    @Body('name') name?: string,
    @Body('level') level?: number,
    @Body('element') element?: string,
    @Body('strengthPoints') strengthPoints?: number,
    @Body('image') image?: string,
  ) {
    id = parseInt(id.toString());
    if (strengthPoints !== undefined) {
      strengthPoints = parseInt(strengthPoints.toString());
    }
    return this.characterService.editCharacter(
      id,
      name,
      level,
      element,
      strengthPoints,
      image,
    );
  }

  @UseGuards(AdminGuard)
  @Post('/delete-character')
  async deleteCharacter(@Body('id') id: number) {
    id = parseInt(id.toString());
    return this.characterService.deleteCharacter(id);
  }

  @UseGuards(AdminGuard)
  @Get('/get-all-characters')
  async getAllCharacters() {
    return this.characterService.getAllCharacters();
  }

  @UseGuards(AuthGuard)
  @Post('/reward-character')
  async rewardCharacter(@Request() req) {
    return this.characterService.rewardCharacter(
      req.walletAddress.toLowerCase(),
    );
  }

  @UseGuards(AuthGuard)
  @Get('/get-user-characters')
  async getUserCharacters(@Request() req) {
    return this.characterService.getUserCharacters(
      req.walletAddress.toLowerCase(),
    );
  }
}
