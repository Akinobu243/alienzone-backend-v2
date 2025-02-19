import {
  Body,
  Controller,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { AdminGuard } from '../auth/guards/admin.guard';
import { ElementService } from './element.service';

@ApiTags('element')
@Controller('/element')
export class ElementController {
  constructor(private elementService: ElementService) {}

  @UseGuards(AdminGuard)
  @Post('/create-element')
  async createElement(
    @Body('name') name: string,
    @Body('image') image: string,
    @Body('background') background?: string,
    @Body('weaknessId') weaknessId?: number,
    @Body('strengthId') strengthId?: number,
  ) {
    if (weaknessId !== undefined) {
      weaknessId = parseInt(weaknessId.toString());
    }
    if (strengthId !== undefined) {
      strengthId = parseInt(strengthId.toString());
    }
    return this.elementService.createElement(name, image, background, weaknessId, strengthId);
  }

  @UseGuards(AdminGuard)
  @Post('/edit-element')
  async editElement(
    @Body('id') id: number,
    @Body('name') name?: string,
    @Body('image') image?: string,
    @Body('background') background?: string,
    @Body('weaknessId') weaknessId?: number,
    @Body('strengthId') strengthId?: number,
  ) {
    id = parseInt(id.toString());
    if (weaknessId !== undefined) {
      weaknessId = parseInt(weaknessId.toString());
    }
    if (strengthId !== undefined) {
      strengthId = parseInt(strengthId.toString());
    }
    return this.elementService.updateElement(id, name, image, background, weaknessId, strengthId);
  }
  
}
