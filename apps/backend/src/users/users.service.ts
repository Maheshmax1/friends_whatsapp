import { Injectable, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async searchUsers(query: string, currentUserId: string) {
    if (!query || !query.trim()) return [];
    const q = query.trim();
    const digitsOnly = q.replace(/\D/g, '');
    const last10Digits = digitsOnly.length >= 10 ? digitsOnly.slice(-10) : digitsOnly;

    const orConditions: any[] = [
      { username: { contains: q, mode: 'insensitive' } },
      { displayName: { contains: q, mode: 'insensitive' } },
      { phoneNumber: { contains: q } },
    ];

    if (digitsOnly.length >= 3) {
      orConditions.push({ phoneNumber: { contains: digitsOnly } });
    }
    if (last10Digits.length >= 4) {
      orConditions.push({ phoneNumber: { contains: last10Digits } });
    }

    return this.prisma.user.findMany({
      where: {
        AND: [
          { id: { not: currentUserId } },
          { OR: orConditions },
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
      take: 15,
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

    const seenContactIds = new Set<string>();
    const uniqueContacts: any[] = [];

    for (const c of contacts) {
      if (!c.contact) continue;
      if (seenContactIds.has(c.contact.id) || (c.contact.phoneNumber && seenContactIds.has(c.contact.phoneNumber))) {
        continue;
      }
      seenContactIds.add(c.contact.id);
      if (c.contact.phoneNumber) seenContactIds.add(c.contact.phoneNumber);

      uniqueContacts.push({
        id: c.contact.id,
        username: c.contact.username,
        phoneNumber: c.contact.phoneNumber,
        displayName: c.nickname || c.contact.displayName || c.contact.username,
        avatarUrl: c.contact.avatarUrl,
        bio: c.contact.bio,
        isOnline: c.contact.isOnline,
        lastSeen: c.contact.lastSeen,
        nickname: c.nickname,
      });
    }

    return uniqueContacts;
  }

  async addContact(userId: string, data: { phoneNumber?: string; contactId?: string; nickname?: string }) {
    let contactId = data.contactId;

    if (!contactId && data.phoneNumber) {
      const rawInput = data.phoneNumber.trim();
      const digitsOnly = rawInput.replace(/\D/g, '');
      const last10Digits = digitsOnly.length >= 10 ? digitsOnly.slice(-10) : digitsOnly;

      const userConditions: any[] = [
        { phoneNumber: rawInput },
        { phoneNumber: digitsOnly },
        { username: { equals: rawInput, mode: 'insensitive' } },
        { displayName: { equals: rawInput, mode: 'insensitive' } },
      ];

      if (digitsOnly.length >= 4) {
        userConditions.push(
          { phoneNumber: `+91${last10Digits}` },
          { phoneNumber: `+${digitsOnly}` },
          { phoneNumber: last10Digits },
          { phoneNumber: { contains: last10Digits } },
          { username: { contains: rawInput, mode: 'insensitive' } },
          { displayName: { contains: rawInput, mode: 'insensitive' } },
        );
      }

      const user = await this.prisma.user.findFirst({
        where: {
          AND: [
            { id: { not: userId } },
            { OR: userConditions },
          ],
        },
      });

      if (!user) {
        throw new BadRequestException(`No user found with "${rawInput}". Please check the phone number or username.`);
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
        await this.prisma.contact.update({
          where: { id: existing.id },
          data: { nickname: data.nickname },
        });
      }
      return { success: true, contactId, alreadyExists: true };
    }

    await this.prisma.contact.create({
      data: {
        userId,
        contactId,
        nickname: data.nickname || null,
      },
    });

    return { success: true, contactId };
  }
}
