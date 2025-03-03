import {
  Body,
  Controller,
  Get,
  Post,
  Request,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { AdminGuard } from '../auth/guards/admin.guard';
import { CharacterService } from './character.service';
import { AuthGuard } from '../auth/guards/auth.guard';
import { CharacterRarity } from '@prisma/client';

@ApiTags('character')
@Controller('/character')
export class CharacterController {
  constructor(private characterService: CharacterService) {}

  @UseGuards(AdminGuard)
  @Post('/create-character')
  async createCharacter(
    @Body('name') name: string,
    @Body('elementId') elementId: number,
    @Body('rarity') rarity: CharacterRarity,
    @Body('power') power: number,
    @Body('image') image: string,
    @Body('portal') portal: number,
  ) {
    power = parseInt(power.toString());
    portal = parseInt(portal.toString());
    return this.characterService.createCharacter(
      name,
      elementId,
      rarity,
      power,
      image,
      portal,
    );
  }

  @UseGuards(AdminGuard)
  @Post('/edit-character')
  async editCharacter(
    @Body('id') id: number,
    @Body('name') name?: string,
    @Body('elementId') elementId?: number,
    @Body('power') power?: number,
    @Body('image') image?: string,
  ) {
    id = parseInt(id.toString());
    if (power !== undefined) {
      power = parseInt(power.toString());
    }
    if (elementId !== undefined) {
      elementId = parseInt(elementId.toString());
    }
    return this.characterService.editCharacter(
      id,
      name,
      elementId,
      power,
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
  @Post('/summon-character')
  async rewardCharacter(@Body('portal') portal: number, @Request() req) {
    portal = parseInt(portal.toString());
    return this.characterService.rewardCharacter(
      req.walletAddress.toLowerCase(),
      portal,
    );
  }

  @UseGuards(AuthGuard)
  @Get('/get-user-characters')
  async getUserCharacters(@Request() req) {
    return this.characterService.getUserCharacters(
      req.walletAddress.toLowerCase(),
    );
  }

  @UseGuards(AuthGuard)
  @Post('/multi-summon-characters')
  async multiSummonCharacters(@Body('portal') portal: number, @Request() req) {
    portal = parseInt(portal.toString());
    return this.characterService.multiSummonCharacters(
      req.walletAddress.toLowerCase(),
      portal,
    );
  }
}
