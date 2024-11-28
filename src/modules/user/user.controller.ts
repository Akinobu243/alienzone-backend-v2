import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { User } from '@prisma/client';
import { ApiBody, ApiQuery, ApiTags } from '@nestjs/swagger';

import { JwtAuthGuard } from '../auth/auth.jwt.guard';
import { RegisterUserDTO } from '../auth/dto/auth.dto';

import { UserService } from './user.service';

@ApiTags('users')
@Controller('/users')
export class UserController {
  constructor(private userService: UserService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
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

  @Post('user')
  @ApiBody({ type: RegisterUserDTO })
  async signupUser(
    @Body() userData: { name?: string; email: string; password: string },
  ): Promise<User> {
    return this.userService.createUser(userData);
  }
}
