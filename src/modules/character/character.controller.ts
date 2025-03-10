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
    @Body('upgradeAmountRequired') upgradeAmountRequired?: number,
    @Body('upgradesToId') upgradesToId?: number,
  ) {
    if (power !== undefined) {
      power = parseInt(power.toString());
    }
    if (elementId !== undefined) {
      elementId = parseInt(elementId.toString());
    }
    if (upgradeAmountRequired !== undefined) {
      upgradeAmountRequired = parseInt(upgradeAmountRequired.toString());
    }
    if (upgradesToId !== undefined) {
      upgradesToId = parseInt(upgradesToId.toString());
    }
    return this.characterService.createCharacter(
      name,
      elementId,
      rarity,
      power,
      image,
      portal,
      upgradeAmountRequired,
      upgradesToId,
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
    @Body('upgradeAmountRequired') upgradeAmountRequired?: number,
    @Body('upgradesToId') upgradesToId?: number,
  ) {
    id = parseInt(id.toString());
    if (power !== undefined) {
      power = parseInt(power.toString());
    }
    if (elementId !== undefined) {
      elementId = parseInt(elementId.toString());
    }
    if (upgradeAmountRequired !== undefined) {
      upgradeAmountRequired = parseInt(upgradeAmountRequired.toString());
    }
    if (upgradesToId !== undefined) {
      upgradesToId = parseInt(upgradesToId.toString());
    }
    return this.characterService.editCharacter(
      id,
      name,
      elementId,
      power,
      image,
      upgradeAmountRequired,
      upgradesToId,
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
    return this.characterService.summonCharacter(
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

  @UseGuards(AuthGuard)
  @Post('/summon-gear')
  async summonGear(@Request() req) {
    return this.characterService.summonGear(req.walletAddress.toLowerCase());
  }

  @UseGuards(AuthGuard)
  @Post('/summon-gear-multi')
  async summonGearMulti(@Request() req, amount: number) {
    const response = [];
    for (let i = 0; i < amount; i++) {
      const r = await this.characterService.summonGear(
        req.walletAddress.toLowerCase(),
      );
      response.push(r);
    }
    return response;
  }

  @UseGuards(AuthGuard)
  @Post('/burn-gear')
  async burnGear(@Request() req, @Body('gearId') gearId: number) {
    gearId = parseInt(gearId.toString());
    return this.characterService.burnGear(
      req.walletAddress.toLowerCase(),
      gearId,
    );
  }

  @UseGuards(AuthGuard)
  @Post('/mint-character')
  async mintCharacter(
    @Request() req,
    @Body('characterId') characterId: number,
    @Body('signature') signature: string,
  ) {
    characterId = parseInt(characterId.toString());
    return this.characterService.mintCharacter(
      req.walletAddress.toLowerCase(),
      characterId,
      signature,
    );
  }

  @UseGuards(AuthGuard)
  @Post('/verify-mint-transaction')
  async verifyMintTransaction(
    @Request() req,
    @Body('mintTransactionId') mintTransactionId: number,
    @Body('characterId') characterId: number,
    @Body('serverSignature') serverSignature: string,
    @Body('txHash') txHash: string,
  ) {
    mintTransactionId = parseInt(mintTransactionId.toString());
    characterId = parseInt(characterId.toString());
    return this.characterService.verifyMintTransaction(
      mintTransactionId,
      req.walletAddress.toLowerCase(),
      characterId,
      serverSignature,
      txHash,
    );
  }
}
