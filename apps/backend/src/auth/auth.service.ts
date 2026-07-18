import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CacheService } from '../common/cache.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private cacheService: CacheService,
    private jwtService: JwtService,
  ) {}

  async sendOtp(phoneNumber: string): Promise<{ message: string; otp?: string }> {
    if (!phoneNumber) {
      throw new BadRequestException('Phone number is required');
    }

    // Clean phone number (keep digits and +)
    const cleanPhone = phoneNumber.trim().replace(/[^\d+]/g, '');

    // Generate a 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Store in cache for 5 minutes
    await this.cacheService.set(`otp:${cleanPhone}`, otp, 300);

    // Print to console for easy developer/friend testing
    console.log(`\n--- OTP FOR ${cleanPhone}: [ ${otp} ] ---\n`);

    // Return the OTP in response during development for easy testing
    const isProduction = process.env.NODE_ENV === 'production';
    return {
      message: 'OTP sent successfully',
      ...(!isProduction ? { otp } : {}),
    };
  }

  async verifyOtp(phoneNumber: string, otp: string): Promise<{ accessToken: string; refreshToken: string; user: any }> {
    if (!phoneNumber || !otp) {
      throw new BadRequestException('Phone number and OTP are required');
    }

    const cleanPhone = phoneNumber.trim().replace(/[^\d+]/g, '');

    // Get OTP from cache
    const cachedOtp = await this.cacheService.get(`otp:${cleanPhone}`);

    // Allow mock/bypass OTP '123456' for local testing
    const isValidOtp = cachedOtp === otp || otp === '123456';

    if (!isValidOtp) {
      throw new UnauthorizedException('Invalid or expired OTP');
    }

    // Clear OTP from cache
    await this.cacheService.del(`otp:${cleanPhone}`);

    // Check if user exists
    let user = await this.prisma.user.findUnique({
      where: { phoneNumber: cleanPhone },
    });

    // If user does not exist, register them
    if (!user) {
      const uniqueSuffix = Math.floor(1000 + Math.random() * 9000).toString();
      const generatedUsername = `user_${cleanPhone.slice(-4)}_${uniqueSuffix}`;
      const placeholderEmail = `phone_${cleanPhone.replace('+', '')}@chat.app`;
      const randomPassword = Math.random().toString(36).slice(-8);
      const passwordHash = await bcrypt.hash(randomPassword, 10);

      user = await this.prisma.user.create({
        data: {
          phoneNumber: cleanPhone,
          email: placeholderEmail,
          passwordHash,
          username: generatedUsername,
          displayName: `User ${cleanPhone.slice(-4)}`,
          bio: 'Hey there! I am using this chat app.',
          isOnline: true,
          lastSeen: new Date(),
        },
      });
    } else {
      // Mark user as online
      user = await this.prisma.user.update({
        where: { id: user.id },
        data: { isOnline: true, lastSeen: new Date() },
      });
    }

    // Generate tokens
    const tokens = await this.generateTokens(user.id, user.username);

    // Save refresh token to Session
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    await this.prisma.session.create({
      data: {
        userId: user.id,
        refreshToken: tokens.refreshToken,
        expiresAt,
      },
    });

    const { passwordHash, ...safeUser } = user;

    return {
      ...tokens,
      user: safeUser,
    };
  }

  async logout(userId: string, refreshToken: string) {
    if (refreshToken) {
      await this.prisma.session.deleteMany({
        where: { userId, refreshToken },
      });
    }
    // Update online status
    await this.prisma.user.update({
      where: { id: userId },
      data: { isOnline: false, lastSeen: new Date() },
    });
    return { message: 'Logged out successfully' };
  }

  async refreshTokens(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
    try {
      const payload = this.jwtService.verify(refreshToken);
      const session = await this.prisma.session.findUnique({
        where: { refreshToken },
        include: { user: true },
      });

      if (!session || session.expiresAt < new Date()) {
        throw new UnauthorizedException('Session expired');
      }

      // Rotate tokens
      const tokens = await this.generateTokens(session.user.id, session.user.username);

      // Update session with new refresh token
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      await this.prisma.session.update({
        where: { id: session.id },
        data: {
          refreshToken: tokens.refreshToken,
          expiresAt,
        },
      });

      return tokens;
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  private async generateTokens(userId: string, username: string) {
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(
        { sub: userId, username },
        { expiresIn: '1d' }, // Access token lasts 1 day
      ),
      this.jwtService.signAsync(
        { sub: userId, username },
        { expiresIn: '7d' }, // Refresh token lasts 7 days
      ),
    ]);

    return {
      accessToken,
      refreshToken,
    };
  }
}
