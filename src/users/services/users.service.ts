import { Injectable } from '@nestjs/common';
import type { User } from '../../generated/prisma/client.js';
import type { CreateUserInput } from '../repositories/inputs/create-user.input.js';
import { UsersRepository } from '../repositories/users.repository.js';
import { normalizeEmail } from '../utils/normalize-email.util.js';

@Injectable()
export class UsersService {
  constructor(private readonly usersRepository: UsersRepository) {}

  findById(id: number): Promise<User | null> {
    return this.usersRepository.findById(id);
  }

  findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findByEmail(normalizeEmail(email));
  }

  create(input: CreateUserInput): Promise<User> {
    return this.usersRepository.create({
      ...input,
      email: normalizeEmail(input.email),
    });
  }
}
