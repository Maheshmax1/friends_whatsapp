import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private activeUsers = new Map<string, string[]>();

  constructor(
    private jwtService: JwtService,
    private prisma: PrismaService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth?.token || client.handshake.query?.token;
      if (!token) {
        client.disconnect();
        return;
      }

      const payload = await this.jwtService.verifyAsync(token);
      const userId = payload.sub;

      client.data.userId = userId;
      client.data.username = payload.username;

      await client.join(`user:${userId}`);

      const userSockets = this.activeUsers.get(userId) || [];
      userSockets.push(client.id);
      this.activeUsers.set(userId, userSockets);

      const chats = await this.prisma.chat.findMany({
        where: { members: { some: { userId } } },
      });
      for (const chat of chats) {
        await client.join(`chat:${chat.id}`);
      }

      await this.prisma.user.update({
        where: { id: userId },
        data: { isOnline: true, lastSeen: new Date() },
      });

      this.server.emit('user_status', { userId, isOnline: true });
      console.log(`Socket connected: ${client.id} (User: ${userId})`);
    } catch (err) {
      console.error('Socket connection auth error:', err.message);
      client.disconnect();
    }
  }

  async handleDisconnect(client: Socket) {
    const userId = client.data.userId;
    if (!userId) return;

    const userSockets = this.activeUsers.get(userId) || [];
    const updatedSockets = userSockets.filter((id) => id !== client.id);
    
    if (updatedSockets.length === 0) {
      this.activeUsers.delete(userId);
      
      try {
        await this.prisma.user.update({
          where: { id: userId },
          data: { isOnline: false, lastSeen: new Date() },
        });
        
        this.server.emit('user_status', { userId, isOnline: false, lastSeen: new Date() });
      } catch (err) {
        console.error('Error updating user status on disconnect:', err.message);
      }
    } else {
      this.activeUsers.set(userId, updatedSockets);
    }
    console.log(`Socket disconnected: ${client.id}`);
  }

  @SubscribeMessage('join_chat')
  async handleJoinChat(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { chatId: string },
  ) {
    const userId = client.data.userId;
    if (!userId) return;

    const member = await this.prisma.chatMember.findUnique({
      where: { chatId_userId: { chatId: data.chatId, userId } },
    });

    if (member) {
      await client.join(`chat:${data.chatId}`);
      return { success: true };
    }
    return { success: false, error: 'Not a member of this chat' };
  }

  @SubscribeMessage('send_message')
  async handleSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { chatId: string; content: string; type?: string },
  ) {
    const userId = client.data.userId;
    if (!userId) return;

    const type = (data.type || 'TEXT') as any;

    const message = await this.prisma.message.create({
      data: {
        chatId: data.chatId,
        senderId: userId,
        content: data.content,
        type,
        status: 'SENT',
      },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
          },
        },
      },
    });

    await this.prisma.chat.update({
      where: { id: data.chatId },
      data: { updatedAt: new Date() },
    });

    this.server.to(`chat:${data.chatId}`).emit('new_message', message);

    return message;
  }

  @SubscribeMessage('typing')
  handleTyping(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { chatId: string; isTyping: boolean },
  ) {
    const userId = client.data.userId;
    if (!userId) return;

    client.to(`chat:${data.chatId}`).emit('typing', {
      chatId: data.chatId,
      userId,
      isTyping: data.isTyping,
    });
  }

  @SubscribeMessage('read_receipt')
  async handleReadReceipt(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { chatId: string; messageId: string },
  ) {
    const userId = client.data.userId;
    if (!userId) return;

    await this.prisma.message.update({
      where: { id: data.messageId },
      data: { status: 'READ' },
    });

    client.to(`chat:${data.chatId}`).emit('message_read', {
      chatId: data.chatId,
      messageId: data.messageId,
      userId,
    });
  }
}
