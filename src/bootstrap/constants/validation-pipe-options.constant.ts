import type { ValidationPipeOptions } from '@nestjs/common';
import { FormValidationException } from '../../http/exceptions/form-validation.exception.js';
import { flattenValidationErrors } from '../../http/utils/flatten-validation-errors.util.js';

export const VALIDATION_PIPE_OPTIONS: ValidationPipeOptions = {
  whitelist: true,
  forbidNonWhitelisted: true,
  transform: true,
  exceptionFactory: (errors) =>
    new FormValidationException(flattenValidationErrors(errors)),
};
