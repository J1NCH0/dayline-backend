import { HttpStatus, Injectable } from '@nestjs/common';
import type { User } from '../../generated/prisma/client.js';
import { FormValidationException } from '../../http/exceptions/form-validation.exception.js';
import { UsersService } from '../../users/services/users.service.js';
import { EMAIL_ALREADY_REGISTERED_MESSAGE } from '../constants/email-already-registered-message.constant.js';
import { PasswordService } from './password.service.js';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly passwordService: PasswordService,
  ) {}

  async register(email: string, password: string): Promise<User> {
    if (await this.usersService.findByEmail(email)) {
      throw new FormValidationException(
        { email: [EMAIL_ALREADY_REGISTERED_MESSAGE] },
        HttpStatus.CONFLICT,
      );
    }

    const passwordHash = await this.passwordService.hash(password);
    return this.usersService.create({ email, passwordHash });
  }
}
