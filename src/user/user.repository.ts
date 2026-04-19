import { Injectable } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { User } from './entities/user.entity';

@Injectable()
export class UserRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<User[]> {
    return this.prisma.user.findMany();
  }

  async findOne(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { id },
    });
  }

  async create(
    userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<User> {
    return this.prisma.user.create({
      data: {
        login: userData.login,
        password: userData.password,
        role: (userData.role as UserRole) ?? UserRole.VIEWER,
      },
    });
  }

  async update(id: string, userData: Partial<User>): Promise<User | null> {
    try {
      return await this.prisma.user.update({
        where: { id },
        data: {
          ...(userData.login !== undefined ? { login: userData.login } : {}),
          ...(userData.password !== undefined
            ? { password: userData.password }
            : {}),
          ...(userData.role !== undefined
            ? { role: userData.role as UserRole }
            : {}),
        },
      });
    } catch {
      return null;
    }
  }

  async remove(id: string): Promise<boolean> {
    try {
      await this.prisma.user.delete({
        where: { id },
      });
      return true;
    } catch {
      return false;
    }
  }
}
