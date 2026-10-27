import { Body, Controller, Get, Post, Req } from '@nestjs/common';
import type { Request } from 'express';
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
}
