import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { User, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

interface GoogleUserData {
  googleId: string;
  email: string;
  name: string;
  avatar?: string;
}

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async validateGoogleUser(userData: GoogleUserData): Promise<User> {
    const { googleId, email, name, avatar } = userData;

    let user = await this.prisma.user.findUnique({
      where: { googleId },
    });

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          googleId,
          email,
          name,
          avatar,
        },
      });
    } else {
      // Only update email (always keep in sync with Google).
      // Preserve name and avatar if the user has customized them.
      const updateData: Prisma.UserUpdateInput = { email };

      // Only update name from Google if user hasn't changed it
      // (i.e. name is still null/empty)
      if (!user.name || user.name.trim().length === 0) {
        updateData.name = name;
      }

      // Only update avatar from Google if user hasn't uploaded a custom one
      // Custom avatars are stored locally (contain '/uploads/avatars/')
      if (!user.avatar || !user.avatar.includes('/uploads/avatars/')) {
        updateData.avatar = avatar;
      }

      user = await this.prisma.user.update({
        where: { id: user.id },
        data: updateData,
      });
    }

    return user;
  }

  async login(user: User): Promise<{ accessToken: string; user: User }> {
    const payload = { sub: user.id, email: user.email };

    return {
      accessToken: this.jwtService.sign(payload),
      user,
    };
  }

  async getProfile(userId: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { id: userId },
    });
  }
}
