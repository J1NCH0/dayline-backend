import { describe, expect, it } from 'bun:test';
import {
  BadRequestException,
  ConflictException,
  HttpException,
  NotFoundException,
} from '@nestjs/common';
import { getHttpExceptionMessage } from '../../../../src/http/utils/get-http-exception-message.util.js';

describe('getHttpExceptionMessage', () => {
  it('uses the message passed to a built-in exception', () => {
    expect(
      getHttpExceptionMessage(new ConflictException('Email is already registered')),
    ).toBe('Email is already registered');
  });

  it('falls back to the default status text', () => {
    expect(getHttpExceptionMessage(new NotFoundException())).toBe('Not Found');
  });

  it('accepts a plain string response', () => {
    expect(getHttpExceptionMessage(new HttpException('Teapot', 418))).toBe(
      'Teapot',
    );
  });

  it('joins array messages', () => {
    expect(
      getHttpExceptionMessage(new BadRequestException(['first', 'second'])),
    ).toBe('first; second');
  });
});
