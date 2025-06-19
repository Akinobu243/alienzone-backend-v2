import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { Element, User } from '@prisma/client';
import { ApiBody, ApiQuery, ApiTags, ApiBasicAuth } from '@nestjs/swagger';

import { RaidsService } from './raids.service';
import { AuthGuard } from '../auth/guards/auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';
import { CreateRaidDTO, EditRaidDTO, LaunchRaidDTO } from './dto/raids.dto';
import { CreateRaidHuntDto } from './dto/create-raid-hunt.dto';
import { RaidCreationGuard } from './guards/raid-creation.guard';

@ApiTags('raids')
@Controller('/raids')
export class RaidsController {
  constructor(private raidsService: RaidsService) {}

  @UseGuards(AuthGuard)
  @Get('/get-list')
  async getRaidsList(@Request() req) {
    return this.raidsService.getRaidsList(req.walletAddress.toLowerCase());
  }

  @UseGuards(AdminGuard)
  @Post('/create-raid')
  @ApiBody({ type: CreateRaidDTO })
  async createRaid(@Body() createRaidDTO: CreateRaidDTO, @Request() req) {
    return this.raidsService.createRaid(
      createRaidDTO.title,
      createRaidDTO.description,
      createRaidDTO.duration,
      createRaidDTO.image,
      createRaidDTO.elementId,
      createRaidDTO.rewards,
    );
  }

  @UseGuards(AdminGuard)
  @Post('/edit-raid')
  @ApiBody({ type: EditRaidDTO })
  async editRaid(@Body() editRaidDto: EditRaidDTO, @Request() req) {
    return this.raidsService.editRaid(
      editRaidDto.raidId,
      editRaidDto.title,
      editRaidDto.description,
      editRaidDto.duration,
      editRaidDto.rewards,
    );
  }

  @UseGuards(AuthGuard)
  @Post('/launch-raid')
  @ApiBody({ type: LaunchRaidDTO })
  async launchRaid(@Body() launchRaidDTO: LaunchRaidDTO, @Request() req) {
    return this.raidsService.launchRaid(
      launchRaidDTO.raidId,
      req.walletAddress,
    );
  }

  @UseGuards(AuthGuard)
  @Get('/get-raid-history')
  async getRaidHistory(@Request() req) {
    return this.raidsService.getRaidHistory(req.walletAddress);
  }

  @UseGuards(RaidCreationGuard)
  @Post('/create')
  @ApiBasicAuth()
  @ApiBody({ type: CreateRaidHuntDto })
  async createRaidOrHunt(@Body() createRaidHuntDto: CreateRaidHuntDto) {
    return this.raidsService.createRaidOrHunt(createRaidHuntDto);
  }
}
