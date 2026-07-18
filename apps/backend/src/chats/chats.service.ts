import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ChatsService {
  constructor(private prisma: PrismaService) {}

  async getOrCreate1to1Chat(userId: string, recipientId: string) {
    if (userId === recipientId) {
      throw new BadRequestException('Cannot create a chat with yourself');
    }

    const existingChat = await this.prisma.chat.findFirst({
      where: {
        isGroup: false,
        AND: [
          { members: { some: { userId: userId } } },
          { members: { some: { userId: recipientId } } },
        ],
      },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                displayName: true,
                avatarUrl: true,
                isOnline: true,
                lastSeen: true,
              },
            },
          },
        },
      },
    });

    if (existingChat) {
      return existingChat;
    }

    return this.prisma.chat.create({
      data: {
        isGroup: false,
        members: {
          create: [
            { userId: userId },
            { userId: recipientId },
          ],
        },
      },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                displayName: true,
                avatarUrl: true,
                isOnline: true,
                lastSeen: true,
              },
            },
          },
        },
      },
    });
  }

  async getChats(userId: string) {
    const chats = await this.prisma.chat.findMany({
      where: {
        members: {
          some: { userId: userId },
        },
      },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                displayName: true,
                avatarUrl: true,
                isOnline: true,
                lastSeen: true,
              },
            },
          },
        },
        messages: {
          where: {
            deletedBy: { none: { userId } }
          },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    return chats.map((chat) => {
      const otherMember = chat.isGroup
        ? null
        : chat.members.find((m) => m.userId !== userId)?.user || null;

      const myMember = chat.members.find((m) => m.userId === userId);

      return {
        id: chat.id,
        isGroup: chat.isGroup,
        name: chat.isGroup ? chat.name : (otherMember?.displayName || otherMember?.username || 'Chat'),
        avatarUrl: chat.isGroup ? chat.avatarUrl : otherMember?.avatarUrl,
        description: chat.description,
        updatedAt: chat.updatedAt,
        otherMember,
        lastMessage: chat.messages[0] || null,
        isPinned: myMember?.isPinned || false,
        isArchived: myMember?.isArchived || false,
        unreadCount: 0, 
      };
    });
  }

  async getMessages(chatId: string, userId: string) {
    const member = await this.prisma.chatMember.findUnique({
      where: {
        chatId_userId: {
          chatId,
          userId,
        },
      },
    });

    if (!member) {
      throw new NotFoundException('Chat not found or access denied');
    }

    const messages = await this.prisma.message.findMany({
      where: { 
        chatId,
        deletedBy: {
          none: { userId }
        }
      },
      orderBy: { createdAt: 'asc' },
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
        },
        starredBy: {
          where: { userId }
        },
        reactions: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                displayName: true
              }
            }
          }
        }
      },
    });

    return messages.map((m) => {
      const { starredBy, ...msg } = m;
      return {
        ...msg,
        isStarred: starredBy.length > 0
      };
    });
  }

  async createGroupChat(userId: string, data: { name: string; memberIds: string[]; description?: string }) {
    const allMembers = Array.from(new Set([userId, ...data.memberIds]));
    return this.prisma.chat.create({
      data: {
        isGroup: true,
        name: data.name,
        description: data.description || null,
        members: {
          create: allMembers.map((mId) => ({
            userId: mId,
            isAdmin: mId === userId,
          })),
        },
      },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                displayName: true,
                avatarUrl: true,
                isOnline: true,
                lastSeen: true,
              }
            }
          }
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      }
    });
  }

  async togglePin(chatId: string, userId: string) {
    const member = await this.prisma.chatMember.findUnique({
      where: { chatId_userId: { chatId, userId } }
    });
    if (!member) throw new NotFoundException('Chat member not found');

    return this.prisma.chatMember.update({
      where: { id: member.id },
      data: { isPinned: !member.isPinned }
    });
  }

  async toggleArchive(chatId: string, userId: string) {
    const member = await this.prisma.chatMember.findUnique({
      where: { chatId_userId: { chatId, userId } }
    });
    if (!member) throw new NotFoundException('Chat member not found');

    return this.prisma.chatMember.update({
      where: { id: member.id },
      data: { isArchived: !member.isArchived }
    });
  }

  async toggleStarMessage(messageId: string, userId: string) {
    const existing = await this.prisma.starredMessage.findUnique({
      where: {
        userId_messageId: { userId, messageId }
      }
    });

    if (existing) {
      await this.prisma.starredMessage.delete({
        where: { id: existing.id }
      });
      return { isStarred: false };
    } else {
      await this.prisma.starredMessage.create({
        data: { userId, messageId }
      });
      return { isStarred: true };
    }
  }

  async deleteMessageForMe(messageId: string, userId: string) {
    const existing = await this.prisma.deletedForMeMessage.findUnique({
      where: {
        userId_messageId: { userId, messageId }
      }
    });

    if (!existing) {
      await this.prisma.deletedForMeMessage.create({
        data: { userId, messageId }
      });
    }
    return { success: true };
  }
}
