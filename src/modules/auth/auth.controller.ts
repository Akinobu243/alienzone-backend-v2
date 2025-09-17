import { Body, Controller, Post, Response } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { JWT_EXPIRY_SECONDS } from '../../shared/constants/global.constants';

import { AuthService } from './auth.service';
import { AuthResponseDTO, AuthUserDTO } from './dto/auth.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('authenticate')
  @ApiOperation({ description: 'Authenticate user' })
  @ApiBody({ type: AuthUserDTO })
  @ApiResponse({ type: AuthResponseDTO })
  async authenticate(
    @Body() user: AuthUserDTO,
    @Response() res,
  ): Promise<AuthResponseDTO> {
    const authData = await this.authService.authenticate(
      user,
      false,
      user.register,
    );

    res.cookie('accessToken', authData.accessToken, {
      expires: new Date(new Date().getTime() + JWT_EXPIRY_SECONDS * 1000),
      sameSite: 'strict',
      secure: true,
      httpOnly: true,
    });

    return res.status(200).send(authData);
  }
}
