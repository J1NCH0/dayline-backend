import { describe, expect, it } from 'bun:test';
import { normalizeEmail } from '../../../../src/users/utils/normalize-email.util.js';

describe('normalizeEmail', () => {
  it.each([
    ['David@Example.com', 'david@example.com'],
    ['  david@example.com  ', 'david@example.com'],
    ['DAVID@EXAMPLE.COM\n', 'david@example.com'],
    ['david@example.com', 'david@example.com'],
  ])('normalizes %j to %j', (input, expected) => {
    expect(normalizeEmail(input)).toBe(expected);
  });
});
