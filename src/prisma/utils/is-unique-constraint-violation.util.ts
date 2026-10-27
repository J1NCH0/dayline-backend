import { Prisma } from '../../generated/prisma/client.js';
import { UNIQUE_CONSTRAINT_VIOLATION_CODE } from '../constants/unique-constraint-violation-code.constant.js';

export function isUniqueConstraintViolation(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === UNIQUE_CONSTRAINT_VIOLATION_CODE
  );
}
