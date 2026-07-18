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
  private statuses: any[] = [];

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
        where: {
          members: {
            some: { userId: userId },
          },
        },
        select: { id: true },
      });

      for (const chat of chats) {
        await client.join(`chat:${chat.id}`);
      }

      await this.prisma.user.update({
        where: { id: userId },
        data: { isOnline: true, lastSeen: new Date() },
      });

      const chatIds = chats.map(c => c.id);
      await this.prisma.message.updateMany({
        where: {
          chatId: { in: chatIds },
          senderId: { not: userId },
          status: 'SENT',
        },
        data: { status: 'DELIVERED' },
      });

      for (const chatId of chatIds) {
        this.server.to(`chat:${chatId}`).emit('messages_delivered_bulk', {
          chatId,
          recipientId: userId,
        });
      }

      this.server.emit('user_status', { userId, isOnline: true });
      client.emit('load_statuses', this.statuses);
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
    @MessageBody() data: { chatId: string; content: string; type?: string; replyToId?: string },
  ) {
    const userId = client.data.userId;
    if (!userId) return;

    const type = (data.type || 'TEXT') as any;

    let initialStatus: 'SENT' | 'DELIVERED' | 'READ' = 'SENT';
    const chat = await this.prisma.chat.findUnique({
      where: { id: data.chatId },
      include: { members: true },
    });
    if (chat) {
      const otherMembers = chat.members.filter(m => m.userId !== userId);
      const isAnyOtherMemberOnline = otherMembers.some(m => {
        const sockets = this.activeUsers.get(m.userId);
        return sockets && sockets.length > 0;
      });
      if (isAnyOtherMemberOnline) {
        initialStatus = 'DELIVERED';
      }
    }

    const message = await this.prisma.message.create({
      data: {
        chatId: data.chatId,
        senderId: userId,
        content: data.content,
        type,
        status: initialStatus,
        replyToId: data.replyToId || null,
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
        replyTo: {
          include: {
            sender: {
              select: {
                id: true,
                username: true,
                displayName: true,
              }
            }
          }
        }
      },
    });

    await this.prisma.chat.update({
      where: { id: data.chatId },
      data: { updatedAt: new Date() },
    });

    this.server.to(`chat:${data.chatId}`).emit('new_message', message);

    return message;
  }

  @SubscribeMessage('edit_message')
  async handleEditMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { chatId: string; messageId: string; content: string },
  ) {
    const userId = client.data.userId;
    if (!userId) return;

    // Verify ownership
    const message = await this.prisma.message.findUnique({
      where: { id: data.messageId }
    });

    if (!message || message.senderId !== userId) return { success: false, error: 'Unauthorized' };

    const updated = await this.prisma.message.update({
      where: { id: data.messageId },
      data: { content: data.content, isEdited: true },
      include: {
        sender: {
          select: { id: true, username: true, displayName: true, avatarUrl: true }
        },
        replyTo: {
          include: {
            sender: {
              select: { id: true, username: true, displayName: true }
            }
          }
        }
      }
    });

    this.server.to(`chat:${data.chatId}`).emit('message_edited', updated);
    return { success: true, message: updated };
  }

  @SubscribeMessage('delete_message_everyone')
  async handleDeleteMessageEveryone(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { chatId: string; messageId: string },
  ) {
    const userId = client.data.userId;
    if (!userId) return;

    // Verify ownership
    const message = await this.prisma.message.findUnique({
      where: { id: data.messageId }
    });

    if (!message || message.senderId !== userId) return { success: false, error: 'Unauthorized' };

    const updated = await this.prisma.message.update({
      where: { id: data.messageId },
      data: { content: 'This message was deleted', isDeleted: true },
      include: {
        sender: {
          select: { id: true, username: true, displayName: true, avatarUrl: true }
        },
        replyTo: {
          include: {
            sender: {
              select: { id: true, username: true, displayName: true }
            }
          }
        }
      }
    });

    this.server.to(`chat:${data.chatId}`).emit('message_deleted_everyone', updated);
    return { success: true, message: updated };
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

  @SubscribeMessage('post_status')
  handlePostStatus(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { text: string; name: string; avatar: string; userId: string; mediaUrl?: string },
  ) {
    const newStatus = {
      id: Math.random().toString(),
      userId: data.userId,
      name: data.name,
      avatar: data.avatar || data.name.slice(0, 2).toUpperCase(),
      text: data.text,
      mediaUrl: data.mediaUrl || '',
      time: 'Just now'
    };
    this.statuses.unshift(newStatus);
    if (this.statuses.length > 25) {
      this.statuses = this.statuses.slice(0, 25);
    }
    this.server.emit('status_posted', newStatus);
  }

  @SubscribeMessage('read_all_messages')
  async handleReadAllMessages(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { chatId: string },
  ) {
    const userId = client.data.userId;
    if (!userId) return;

    await this.prisma.message.updateMany({
      where: {
        chatId: data.chatId,
        senderId: { not: userId },
        status: { not: 'READ' },
      },
      data: { status: 'READ' },
    });

    client.to(`chat:${data.chatId}`).emit('messages_read_bulk', {
      chatId: data.chatId,
      readerId: userId,
    });
  }

  @SubscribeMessage('call_user')
  handleCallUser(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { chatId: string; type: 'voice' | 'video'; recipientId: string; callerName: string },
  ) {
    const userId = client.data.userId;
    if (!userId) return;

    this.server.to(`user:${data.recipientId}`).emit('incoming_call', {
      chatId: data.chatId,
      type: data.type,
      callerId: userId,
      callerName: data.callerName,
    });
  }

  @SubscribeMessage('accept_call')
  handleAcceptCall(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { callerId: string; chatId: string },
  ) {
    this.server.to(`user:${data.callerId}`).emit('call_accepted', {
      chatId: data.chatId,
    });
  }

  @SubscribeMessage('call_signal')
  handleCallSignal(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { chatId: string; recipientId: string; offer?: any; answer?: any; candidate?: any },
  ) {
    const userId = client.data.userId;
    if (!userId) return;

    this.server.to(`user:${data.recipientId}`).emit('call_signal', {
      chatId: data.chatId,
      senderId: userId,
      offer: data.offer,
      answer: data.answer,
      candidate: data.candidate,
    });
  }

  @SubscribeMessage('decline_call')
  handleDeclineCall(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { callerId: string; chatId: string },
  ) {
    this.server.to(`user:${data.callerId}`).emit('call_declined', {
      chatId: data.chatId,
    });
  }

  @SubscribeMessage('end_call')
  handleEndCall(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { chatId: string; recipientId: string },
  ) {
    this.server.to(`user:${data.recipientId}`).emit('call_ended', {
      chatId: data.chatId,
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

  @SubscribeMessage('toggle_reaction')
  async handleToggleReaction(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { chatId: string; messageId: string; emoji: string },
  ) {
    const userId = client.data.userId;
    if (!userId) return { success: false };

    const existing = await this.prisma.messageReaction.findUnique({
      where: {
        messageId_userId: {
          messageId: data.messageId,
          userId,
        },
      },
    });

    if (existing) {
      if (existing.emoji === data.emoji) {
        await this.prisma.messageReaction.delete({
          where: { id: existing.id },
        });
      } else {
        await this.prisma.messageReaction.update({
          where: { id: existing.id },
          data: { emoji: data.emoji },
        });
      }
    } else {
      await this.prisma.messageReaction.create({
        data: {
          messageId: data.messageId,
          userId,
          emoji: data.emoji,
        },
      });
    }

    const reactions = await this.prisma.messageReaction.findMany({
      where: { messageId: data.messageId },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
          },
        },
      },
    });

    this.server.to(`chat:${data.chatId}`).emit('message_reaction_toggled', {
      messageId: data.messageId,
      chatId: data.chatId,
      reactions,
    });

    return { success: true, reactions };
  }
}
