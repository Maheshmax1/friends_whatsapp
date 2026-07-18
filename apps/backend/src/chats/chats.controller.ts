import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
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
}
