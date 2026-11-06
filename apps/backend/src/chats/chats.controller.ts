import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ChatsService } from './chats.service';
import { JwtGuard } from '../auth/jwt.guard';
import { GetUser } from '../auth/get-user.decorator';

@UseGuards(JwtGuard)
@Controller('chats')
export class ChatsController {
  constructor(private chatsService: ChatsService) {}

  @Post()
  async getOrCreate1to1Chat(
    @GetUser('sub') userId: string,
    @Body('recipientId') recipientId: string,
  ) {
    return this.chatsService.getOrCreate1to1Chat(userId, recipientId);
  }

  @Get()
  async getChats(@GetUser('sub') userId: string) {
    return this.chatsService.getChats(userId);
  }

  @Get(':chatId/messages')
  async getMessages(
    @Param('chatId') chatId: string,
    @GetUser('sub') userId: string,
  ) {
    return this.chatsService.getMessages(chatId, userId);
  }

  @Patch(':chatId')
  async updateGroupDetails(
    @Param('chatId') chatId: string,
    @GetUser('sub') userId: string,
    @Body() body: { name?: string; description?: string },
  ) {
    return this.chatsService.updateGroupDetails(chatId, userId, body);
  }

  @Patch(':chatId/pin')
  async togglePin(
    @Param('chatId') chatId: string,
    @GetUser('sub') userId: string,
  ) {
    return this.chatsService.togglePin(chatId, userId);
  }

  @Patch(':chatId/archive')
  async toggleArchive(
    @Param('chatId') chatId: string,
    @GetUser('sub') userId: string,
  ) {
    return this.chatsService.toggleArchive(chatId, userId);
  }

  @Post('messages/:messageId/star')
  async toggleStarMessage(
    @Param('messageId') messageId: string,
    @GetUser('sub') userId: string,
  ) {
    return this.chatsService.toggleStarMessage(messageId, userId);
  }

  @Post('messages/:messageId/delete-for-me')
  async deleteMessageForMe(
    @Param('messageId') messageId: string,
    @GetUser('sub') userId: string,
  ) {
    return this.chatsService.deleteMessageForMe(messageId, userId);
  }

  @Post('group')
  async createGroupChat(
    @GetUser('sub') userId: string,
    @Body() body: { name: string; memberIds: string[]; description?: string },
  ) {
    return this.chatsService.createGroupChat(userId, body);
  }

  @Post(':chatId/members')
  async addMembersToGroup(
    @Param('chatId') chatId: string,
    @GetUser('sub') userId: string,
    @Body('memberIds') memberIds: string[],
  ) {
    return this.chatsService.addMembersToGroup(chatId, userId, memberIds);
  }

  @Patch(':chatId/members/:targetUserId/admin')
  async toggleAdminRole(
    @Param('chatId') chatId: string,
    @Param('targetUserId') targetUserId: string,
    @GetUser('sub') userId: string,
    @Body('isAdmin') isAdmin: boolean,
  ) {
    return this.chatsService.toggleAdminRole(chatId, userId, targetUserId, isAdmin);
  }

  @Delete(':chatId/members/:targetUserId')
  async removeMember(
    @Param('chatId') chatId: string,
    @Param('targetUserId') targetUserId: string,
    @GetUser('sub') userId: string,
  ) {
    return this.chatsService.removeMember(chatId, userId, targetUserId);
  }

  @Post(':chatId/join')
  async joinGroupViaInvite(
    @Param('chatId') chatId: string,
    @GetUser('sub') userId: string,
  ) {
    return this.chatsService.joinGroupViaInvite(chatId, userId);
  }

  @Delete(':chatId')
  async deleteChat(
    @Param('chatId') chatId: string,
    @GetUser('sub') userId: string,
  ) {
    return this.chatsService.deleteChat(chatId, userId);
  }

  @Get('status')
  async getStatuses() {
    return this.chatsService.getStatuses();
  }
}
