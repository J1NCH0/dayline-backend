import { IsAccountEmail } from '../../validation/is-account-email.validation.js';
import { IsPassword } from '../../validation/is-password.validation.js';

export class RegisterRequestDto {
  @IsAccountEmail()
  email: string;

  @IsPassword()
  password: string;
}
