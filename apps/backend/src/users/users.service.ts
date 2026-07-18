import { Injectable, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async searchUsers(query: string, currentUserId: string) {
    if (!query) return [];

    return this.prisma.user.findMany({
      where: {
        AND: [
          { id: { not: currentUserId } },
          {
            OR: [
              { username: { contains: query, mode: 'insensitive' } },
              { phoneNumber: { contains: query } },
              { displayName: { contains: query, mode: 'insensitive' } },
            ],
          },
        ],
      },
      select: {
        id: true,
        username: true,
        phoneNumber: true,
        displayName: true,
        avatarUrl: true,
        bio: true,
        isOnline: true,
        lastSeen: true,
      },
      take: 10,
    });
  }

  async updateProfile(
    userId: string,
    data: {
      displayName?: string;
      username?: string;
      bio?: string;
      avatarUrl?: string;
      showLastSeen?: boolean;
      showReadReceipts?: boolean;
      allowNotifications?: boolean;
    },
  ) {
    if (data.username) {
      const existingUser = await this.prisma.user.findUnique({
        where: { username: data.username },
      });
      if (existingUser && existingUser.id !== userId) {
        throw new ConflictException('Username is already taken');
      }
    }

    const user = await this.prisma.user.update({
      where: { id: userId },
      data,
    });

    const { passwordHash, ...safeUser } = user;
    return safeUser;
  }

  async getContacts(userId: string) {
    const contacts = await this.prisma.contact.findMany({
      where: { userId },
      include: {
        contact: {
          select: {
            id: true,
            username: true,
            phoneNumber: true,
            displayName: true,
            avatarUrl: true,
            bio: true,
            isOnline: true,
            lastSeen: true,
          },
        },
      },
    });

    return contacts.map((c) => ({
      id: c.contact.id,
      username: c.contact.username,
      phoneNumber: c.contact.phoneNumber,
      displayName: c.nickname || c.contact.displayName || c.contact.username,
      avatarUrl: c.contact.avatarUrl,
      bio: c.contact.bio,
      isOnline: c.contact.isOnline,
      lastSeen: c.contact.lastSeen,
      nickname: c.nickname,
    }));
  }

  async addContact(userId: string, data: { phoneNumber?: string; contactId?: string; nickname?: string }) {
    let contactId = data.contactId;

    if (!contactId && data.phoneNumber) {
      const cleanPhone = data.phoneNumber.trim().replace(/[^\d+]/g, '');
      const user = await this.prisma.user.findUnique({
        where: { phoneNumber: cleanPhone },
      });
      if (!user) {
        throw new BadRequestException('User with this phone number not found');
      }
      contactId = user.id;
    }

    if (!contactId) {
      throw new BadRequestException('Either contactId or phoneNumber must be provided');
    }

    if (contactId === userId) {
      throw new BadRequestException('You cannot add yourself as a contact');
    }

    const existing = await this.prisma.contact.findUnique({
      where: {
        userId_contactId: {
          userId,
          contactId,
        },
      },
    });

    if (existing) {
      if (data.nickname) {
        return this.prisma.contact.update({
          where: { id: existing.id },
          data: { nickname: data.nickname },
        });
      }
      return existing;
    }

    return this.prisma.contact.create({
      data: {
        userId,
        contactId,
        nickname: data.nickname,
      },
    });
  }
}
