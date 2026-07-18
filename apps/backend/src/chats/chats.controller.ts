import { Controller, Get, Post, Patch, Body, Param, UseGuards } from '@nestjs/common';
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

  @Get('status')
  async getStatuses() {
    return this.chatsService.getStatuses();
  }
}
