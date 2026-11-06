import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ChatsService {
  constructor(private prisma: PrismaService) {}

  private statuses: any[] = [];

  addStatus(userId: string, name: string, avatar: string, text: string) {
    const newStatus = {
      id: Math.random().toString(),
      userId,
      name,
      avatar: avatar || name.slice(0, 2).toUpperCase(),
      text,
      time: 'Just now'
    };
    this.statuses.unshift(newStatus);
    if (this.statuses.length > 25) {
      this.statuses = this.statuses.slice(0, 25);
    }
    return newStatus;
  }

  getStatuses() {
    return this.statuses;
  }

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

    const seenOtherUserIds = new Set<string>();
    const deduplicatedList: any[] = [];

    for (const chat of chats) {
      const otherMember = chat.isGroup
        ? null
        : chat.members.find((m) => m.userId !== userId)?.user || null;

      if (!chat.isGroup && otherMember) {
        if (seenOtherUserIds.has(otherMember.id)) {
          continue; // skip duplicate chat for the same user
        }
        seenOtherUserIds.add(otherMember.id);
      }

      const myMember = chat.members.find((m) => m.userId === userId);

      deduplicatedList.push({
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
      });
    }

    return deduplicatedList;
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

  async addMembersToGroup(chatId: string, userId: string, memberIds: string[]) {
    const chat = await this.prisma.chat.findUnique({
      where: { id: chatId },
      include: { members: true },
    });
    if (!chat || !chat.isGroup) {
      throw new NotFoundException('Group chat not found');
    }
    const requester = chat.members.find((m) => m.userId === userId);
    if (!requester) {
      throw new NotFoundException('Access denied');
    }

    const existingMemberUserIds = new Set(chat.members.map((m) => m.userId));
    const newMembers = memberIds.filter((id) => !existingMemberUserIds.has(id));

    if (newMembers.length > 0) {
      await this.prisma.chatMember.createMany({
        data: newMembers.map((id) => ({
          chatId,
          userId: id,
          isAdmin: false,
        })),
        skipDuplicates: true,
      });
    }

    return this.prisma.chat.findUnique({
      where: { id: chatId },
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

  async deleteChat(chatId: string, userId: string) {
    const chat = await this.prisma.chat.findUnique({
      where: { id: chatId },
      include: { members: true },
    });
    if (!chat) throw new NotFoundException('Chat not found');

    await this.prisma.chatMember.deleteMany({
      where: { chatId, userId },
    });

    const remaining = await this.prisma.chatMember.count({ where: { chatId } });
    if (remaining === 0) {
      await this.prisma.chat.delete({ where: { id: chatId } }).catch(() => {});
    }
    return { success: true };
  }
}
