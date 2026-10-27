import type { HttpException } from '@nestjs/common';

export function getHttpExceptionMessage(exception: HttpException): string {
  const response = exception.getResponse();

  if (typeof response === 'string') {
    return response;
  }

  const message = (response as { message?: unknown }).message;
  if (Array.isArray(message)) {
    return message.join('; ');
  }
  if (typeof message === 'string') {
    return message;
  }

  return exception.message;
}
