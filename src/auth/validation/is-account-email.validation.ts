import { applyDecorators } from '@nestjs/common';
import { Transform } from 'class-transformer';
import { IsEmail, MaxLength } from 'class-validator';
import { EMAIL_MAX_LENGTH } from '../constants/email-max-length.constant.js';

export function IsAccountEmail(): PropertyDecorator {
  return applyDecorators(
    Transform(({ value }) => (typeof value === 'string' ? value.trim() : value)),
    IsEmail(),
    MaxLength(EMAIL_MAX_LENGTH),
  );
}
