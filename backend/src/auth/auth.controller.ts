import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import * as express from 'express';
import { ThrottlerGuard, Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

import { Public } from './decorators/public.decorator';
import { AllowAnyRole } from './decorators/allow-any-role.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  @Post('register')
  async register(@Body() data: RegisterDto) {
    return this.authService.register(data);
  }

  @Public()
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Post('register-open')
  async registerOpen(@Body() data: import('./dto/register.dto').OpenRegisterDto) {
    return this.authService.registerOpen(data);
  }

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @HttpCode(HttpStatus.OK)
  @Post('login')
  async login(
    @Body() loginDto: LoginDto,
    @Req() req: express.Request,
    @Res() res: express.Response,
  ) {
    const result = await this.authService.login(
      loginDto,
      req.ip || 'unknown',
      req.headers['user-agent'],
    );

    res.cookie('refresh_token', result.refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    return res.send({
      access_token: result.access_token,
      user: result.user,
      organizationConfig: result.organizationConfig,
    });
  }

  @Public()
  @UseGuards(ThrottlerGuard)
  @Post('refresh')
  async refresh(@Req() req: express.Request, @Res() res: express.Response) {
    const refreshToken = req.cookies['refresh_token'];
    if (!refreshToken) {
      return res
        .status(HttpStatus.UNAUTHORIZED)
        .send({ message: 'No refresh token' });
    }

    const result = await this.authService.refresh(refreshToken);

    res.cookie('refresh_token', result.refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    return res.send({
      access_token: result.access_token,
    });
  }

  @AllowAnyRole()
  @UseGuards(JwtAuthGuard)
  @Post('switch-organization')
  async switchOrganization(
    @Req() req: any,
    @Res() res: express.Response,
    @Body('organizationId') organizationId: string,
  ) {
    const currentRefreshToken = req.cookies?.['refresh_token'];
    const result = await this.authService.switchOrganization(
      req.user.userId,
      organizationId,
      currentRefreshToken,
    );

    res.cookie('refresh_token', result.refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    return res.send({
      access_token: result.access_token,
    });
  }

  @AllowAnyRole()
  @UseGuards(JwtAuthGuard)
  @Post('logout')
  async logout(@Req() req: any, @Res() res: express.Response) {
    const refreshToken = req.cookies['refresh_token'];
    await this.authService.logout(req.user.userId, refreshToken);
    res.clearCookie('refresh_token');
    return res.send({ message: 'Logged out successfully' });
  }

  @Public()
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  @Post('forgot-password')
  async forgotPassword(@Body('email') email: string) {
    if (!email) {
      return { message: 'If that email exists, a reset link has been sent.' };
    }
    const formattedEmail = email.trim().toLowerCase();
    await this.authService.forgotPassword(formattedEmail);
    return { message: 'If that email exists, a reset link has been sent.' };
  }

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('reset-password')
  async resetPassword(@Body() body: any) {
    const { token, newPassword } = body;
    if (!token || !newPassword) {
      return { message: 'Token and new password are required.' };
    }
    await this.authService.resetPassword(token, newPassword);
    return { message: 'Password has been successfully reset.' };
  }
}
