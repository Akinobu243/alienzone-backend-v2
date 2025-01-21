import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { User } from '@prisma/client';
import { ApiBody, ApiQuery, ApiTags } from '@nestjs/swagger';

import { RegisterUserDTO } from '../auth/dto/auth.dto';

import { UserService } from './user.service';
import { AdminGuard } from '../auth/guards/admin.guard';

@ApiTags('users')
@Controller('/users')
export class UserController {
  constructor(private userService: UserService) {}

  @Get('/check-exists')
  async checkExists(@Query('walletAddress') walletAddress: string) {
    return this.userService.checkExists(walletAddress);
  }

  @Get()
  @UseGuards(AdminGuard)
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Number of items per page',
    example: 10,
  })
  async getAll(
    @Query('page') page = '1',
    @Query('limit') limit = '10',
  ): Promise<{ data: User[]; total: number; page: number; limit: number }> {
    const parsedPage = parseInt(page);
    const parsedLimit = parseInt(limit);
    const skip = (parsedPage - 1) * parsedLimit;
    const take = parsedLimit;
    const [data, total] = await Promise.all([
      this.userService.users({ skip, take }),
      this.userService.countUsers(),
    ]);
    return { data, total, page: parsedPage, limit: parsedLimit };
  }
}
