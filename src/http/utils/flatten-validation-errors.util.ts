import type { ValidationError } from 'class-validator';
import type { FieldErrors } from '../types/field-errors.type.js';

export function flattenValidationErrors(
  errors: ValidationError[],
  parentPath = '',
): FieldErrors {
  const fieldErrors: FieldErrors = {};

  for (const error of errors) {
    const path = parentPath ? `${parentPath}.${error.property}` : error.property;
    const messages = Object.values(error.constraints ?? {});

    if (messages.length > 0) {
      fieldErrors[path] = messages;
    }
    Object.assign(
      fieldErrors,
      flattenValidationErrors(error.children ?? [], path),
    );
  }

  return fieldErrors;
}
