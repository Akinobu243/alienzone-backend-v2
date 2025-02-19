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
import { ApiBody, ApiQuery, ApiTags } from '@nestjs/swagger';

import { RaidsService } from './raids.service';
import { AuthGuard } from '../auth/guards/auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';
import { CreateRaidDTO, EditRaidDTO, LaunchRaidDTO } from './dto/raids.dto';

@ApiTags('raids')
@Controller('/raids')
export class RaidsController {
  constructor(private raidsService: RaidsService) {}

  @UseGuards(AuthGuard)
  @Get('/get-list')
  async getRaidsList() {
    return this.raidsService.getRaidsList();
  }

  @UseGuards(AdminGuard)
  @Post('/create-raid')
  @ApiBody({ type: CreateRaidDTO })
  async createRaid(@Body() createRaidDTO: CreateRaidDTO, @Request() req) {
    const raidType = createRaidDTO.type as Element;
    return this.raidsService.createRaid(
      createRaidDTO.title,
      createRaidDTO.description,
      createRaidDTO.duration,
      createRaidDTO.icon,
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
      launchRaidDTO.alienIds,
      launchRaidDTO.characterIds,
      req.walletAddress,
    );
  }

  @UseGuards(AuthGuard)
  @Get('/get-raid-history')
  async getRaidHistory(@Request() req) {
    return this.raidsService.getRaidHistory(req.walletAddress);
  }
}
