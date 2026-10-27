import { Injectable } from '@nestjs/common';
import type { User } from '../../generated/prisma/client.js';
import { PrismaService } from '../../prisma/services/prisma.service.js';
import type { CreateUserInput } from './inputs/create-user.input.js';

@Injectable()
export class UsersRepository {
  constructor(private readonly prisma: PrismaService) {}

  findById(id: number): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { id } });
  }

  findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { email } });
  }

  create(input: CreateUserInput): Promise<User> {
    return this.prisma.user.create({ data: input });
  }
}
