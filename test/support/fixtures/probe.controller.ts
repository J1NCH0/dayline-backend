import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';
import { Prisma } from '../../../src/generated/prisma/client.js';
import { FormValidationException } from '../../../src/http/exceptions/form-validation.exception.js';
import { ProbeRequestDto } from './probe.request.dto.js';

@Controller('test-probe')
export class ProbeController {
  @Post('echo')
  echo(@Body() body: ProbeRequestDto) {
    return { name: body.name, isDto: body instanceof ProbeRequestDto };
  }

  @Get('ip')
  ip(@Req() request: Request) {
    return { ip: request.ip };
  }

  @Get('crash')
  crash(): never {
    throw new Error('secret internal detail');
  }

  @Get('unique-conflict')
  uniqueConflict(): never {
    throw new Prisma.PrismaClientKnownRequestError('duplicate', {
      code: 'P2002',
      clientVersion: Prisma.prismaVersion.client,
    });
  }

  @Get('field-conflict')
  fieldConflict(): never {
    throw new FormValidationException(
      { email: ['Email is already registered'] },
      HttpStatus.CONFLICT,
    );
  }

  @Delete('nothing')
  @HttpCode(HttpStatus.NO_CONTENT)
  nothing(): void {}
}
