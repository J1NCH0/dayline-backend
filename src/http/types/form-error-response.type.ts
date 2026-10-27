import type { FieldErrors } from './field-errors.type.js';

export type FormErrorResponse = {
  status: number;
  errors: FieldErrors;
};
