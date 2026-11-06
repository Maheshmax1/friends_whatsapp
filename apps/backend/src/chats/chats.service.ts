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

      const addedUsers = await this.prisma.user.findMany({
        where: { id: { in: newMembers } },
        select: { displayName: true, username: true },
      });
      const names = addedUsers.map((u) => u.displayName || u.username).join(', ');
      await this.prisma.message.create({
        data: {
          chatId,
          senderId: userId,
          content: `SYSTEM:added ${names}`,
        },
      }).catch(() => {});
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

  async updateGroupDetails(chatId: string, userId: string, data: { name?: string; description?: string }) {
    const chat = await this.prisma.chat.findUnique({
      where: { id: chatId },
      include: { members: true },
    });
    if (!chat || !chat.isGroup) throw new NotFoundException('Group not found');
    const requester = chat.members.find((m) => m.userId === userId);
    if (!requester) throw new NotFoundException('Access denied');

    const updated = await this.prisma.chat.update({
      where: { id: chatId },
      data: {
        name: data.name !== undefined ? data.name : chat.name,
        description: data.description !== undefined ? data.description : chat.description,
      },
    });

    if (data.name && data.name !== chat.name) {
      await this.prisma.message.create({
        data: {
          chatId,
          senderId: userId,
          content: `SYSTEM:changed the group subject to "${data.name}"`,
        },
      }).catch(() => {});
    }

    return updated;
  }

  async toggleAdminRole(chatId: string, requesterId: string, targetUserId: string, isAdmin: boolean) {
    const chat = await this.prisma.chat.findUnique({
      where: { id: chatId },
      include: { members: true },
    });
    if (!chat || !chat.isGroup) throw new NotFoundException('Group not found');
    const requester = chat.members.find((m) => m.userId === requesterId);
    if (!requester || !requester.isAdmin) {
      throw new BadRequestException('Only group admins can manage admin roles');
    }

    const targetMember = chat.members.find((m) => m.userId === targetUserId);
    if (!targetMember) throw new NotFoundException('Member not found in group');

    await this.prisma.chatMember.update({
      where: { id: targetMember.id },
      data: { isAdmin },
    });

    const targetUser = await this.prisma.user.findUnique({
      where: { id: targetUserId },
      select: { displayName: true, username: true },
    });
    const name = targetUser?.displayName || targetUser?.username || 'Member';
    await this.prisma.message.create({
      data: {
        chatId,
        senderId: requesterId,
        content: `SYSTEM:${isAdmin ? `${name} is now an admin` : `${name} is no longer an admin`}`,
      },
    }).catch(() => {});

    return { success: true };
  }

  async removeMember(chatId: string, requesterId: string, targetUserId: string) {
    const chat = await this.prisma.chat.findUnique({
      where: { id: chatId },
      include: { members: true },
    });
    if (!chat || !chat.isGroup) throw new NotFoundException('Group not found');
    const requester = chat.members.find((m) => m.userId === requesterId);
    if (!requester) throw new NotFoundException('Access denied');

    if (requesterId !== targetUserId && !requester.isAdmin) {
      throw new BadRequestException('Only admins can remove members');
    }

    await this.prisma.chatMember.deleteMany({
      where: { chatId, userId: targetUserId },
    });

    const targetUser = await this.prisma.user.findUnique({
      where: { id: targetUserId },
      select: { displayName: true, username: true },
    });
    const name = targetUser?.displayName || targetUser?.username || 'Member';
    await this.prisma.message.create({
      data: {
        chatId,
        senderId: requesterId,
        content: `SYSTEM:${requesterId === targetUserId ? `${name} left the group` : `${name} was removed`}`,
      },
    }).catch(() => {});

    return { success: true };
  }

  async joinGroupViaInvite(chatId: string, userId: string) {
    const chat = await this.prisma.chat.findUnique({
      where: { id: chatId },
      include: { members: true },
    });
    if (!chat || !chat.isGroup) throw new NotFoundException('Group not found');

    const existing = chat.members.find((m) => m.userId === userId);
    if (!existing) {
      await this.prisma.chatMember.create({
        data: {
          chatId,
          userId,
          isAdmin: false,
        },
      });
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { displayName: true, username: true },
      });
      const name = user?.displayName || user?.username || 'User';
      await this.prisma.message.create({
        data: {
          chatId,
          senderId: userId,
          content: `SYSTEM:${name} joined using group link`,
        },
      }).catch(() => {});
    }

    return chat;
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

  async previewGroup(chatId: string) {
    const chat = await this.prisma.chat.findUnique({
      where: { id: chatId },
      include: {
        members: {
          select: { id: true, userId: true },
        },
      },
    });
    if (!chat || !chat.isGroup) {
      throw new NotFoundException('Group not found');
    }
    return {
      id: chat.id,
      name: chat.name,
      description: chat.description,
      avatarUrl: chat.avatarUrl,
      memberCount: chat.members.length,
    };
  }
}
