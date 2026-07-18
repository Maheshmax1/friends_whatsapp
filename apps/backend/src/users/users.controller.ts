import { Controller, Get, Patch, Post, Body, Query, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtGuard } from '../auth/jwt.guard';
import { GetUser } from '../auth/get-user.decorator';

@UseGuards(JwtGuard)
@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get('search')
  async searchUsers(
    @Query('q') query: string,
    @GetUser('sub') userId: string,
  ) {
    return this.usersService.searchUsers(query, userId);
  }

  @Patch('profile')
  async updateProfile(
    @GetUser('sub') userId: string,
    @Body()
    body: {
      displayName?: string;
      username?: string;
      bio?: string;
      avatarUrl?: string;
      showLastSeen?: boolean;
      showReadReceipts?: boolean;
      allowNotifications?: boolean;
    },
  ) {
    return this.usersService.updateProfile(userId, body);
  }

  @Get('contacts')
  async getContacts(@GetUser('sub') userId: string) {
    return this.usersService.getContacts(userId);
  }

  @Post('contacts')
  async addContact(
    @GetUser('sub') userId: string,
    @Body() body: { phoneNumber?: string; contactId?: string; nickname?: string },
  ) {
    return this.usersService.addContact(userId, body);
  }
}
