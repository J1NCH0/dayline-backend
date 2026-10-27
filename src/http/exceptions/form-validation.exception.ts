import { HttpException, HttpStatus } from '@nestjs/common';
import type { FieldErrors } from '../types/field-errors.type.js';

export class FormValidationException extends HttpException {
  constructor(
    readonly fieldErrors: FieldErrors,
    status: number = HttpStatus.BAD_REQUEST,
  ) {
    super({ errors: fieldErrors }, status);
  }
}
