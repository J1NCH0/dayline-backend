import { describe, expect, it } from 'bun:test';
import { ValidationError } from 'class-validator';
import { flattenValidationErrors } from '../../../../src/http/utils/flatten-validation-errors.util.js';

function validationError(
  property: string,
  constraints?: Record<string, string>,
  children: ValidationError[] = [],
): ValidationError {
  return Object.assign(new ValidationError(), {
    property,
    constraints,
    children,
  });
}

describe('flattenValidationErrors', () => {
  it('groups all messages per field', () => {
    const errors = [
      validationError('email', {
        isEmail: 'email must be an email',
        maxLength: 'email must be shorter than or equal to 254 characters',
      }),
      validationError('password', {
        isLength: 'password must be longer than or equal to 12 characters',
      }),
    ];

    expect(flattenValidationErrors(errors)).toEqual({
      email: [
        'email must be an email',
        'email must be shorter than or equal to 254 characters',
      ],
      password: ['password must be longer than or equal to 12 characters'],
    });
  });

  it('uses dot paths for nested objects', () => {
    const errors = [
      validationError('address', undefined, [
        validationError('city', { isString: 'city must be a string' }),
      ]),
    ];

    expect(flattenValidationErrors(errors)).toEqual({
      'address.city': ['city must be a string'],
    });
  });

  it('returns an empty object for no errors', () => {
    expect(flattenValidationErrors([])).toEqual({});
  });
});
