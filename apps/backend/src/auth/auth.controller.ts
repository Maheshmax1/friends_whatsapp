import { Controller, Post, Get, Body, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtGuard } from './jwt.guard';
import { GetUser } from './get-user.decorator';
import { PrismaService } from '../prisma/prisma.service';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private prisma: PrismaService,
  ) {}

  @Post('send-otp')
  async sendOtp(@Body('phoneNumber') phoneNumber: string) {
    return this.authService.sendOtp(phoneNumber);
  }

  @Post('verify-otp')
  async verifyOtp(
    @Body('phoneNumber') phoneNumber: string,
    @Body('otp') otp: string,
  ) {
    return this.authService.verifyOtp(phoneNumber, otp);
  }

  @Post('check-phone')
  async checkPhone(@Body('phoneNumber') phoneNumber: string) {
    return this.authService.checkPhone(phoneNumber);
  }

  @Post('login-pass')
  async loginPass(
    @Body('phoneNumber') phoneNumber: string,
    @Body('password') pass: string,
  ) {
    return this.authService.loginPass(phoneNumber, pass);
  }

  @Post('register-pass')
  async registerPass(
    @Body('phoneNumber') phoneNumber: string,
    @Body('password') pass: string,
  ) {
    return this.authService.registerPass(phoneNumber, pass);
  }

  @Post('refresh')
  async refresh(@Body('refreshToken') refreshToken: string) {
    return this.authService.refreshTokens(refreshToken);
  }

  @UseGuards(JwtGuard)
  @Post('logout')
  async logout(
    @GetUser('sub') userId: string,
    @Body('refreshToken') refreshToken: string,
  ) {
    return this.authService.logout(userId, refreshToken);
  }

  @UseGuards(JwtGuard)
  @Get('me')
  async me(@GetUser('sub') userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (user) {
      const { passwordHash, ...safeUser } = user;
      return safeUser;
    }
    return null;
  }
}
