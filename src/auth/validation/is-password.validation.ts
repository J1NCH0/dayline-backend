import { applyDecorators } from '@nestjs/common';
import { IsString, Length } from 'class-validator';
import { PASSWORD_MAX_LENGTH } from '../constants/password-max-length.constant.js';
import { PASSWORD_MIN_LENGTH } from '../constants/password-min-length.constant.js';

export function IsPassword(): PropertyDecorator {
  return applyDecorators(
    IsString(),
    Length(PASSWORD_MIN_LENGTH, PASSWORD_MAX_LENGTH),
  );
}
