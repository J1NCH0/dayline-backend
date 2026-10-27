import { Body, Controller, Post } from '@nestjs/common';
import type { UserResponseDto } from '../../users/dto/response/user.response.dto.js';
import { UserMapper } from '../../users/mappers/user.mapper.js';
import { RegisterRequestDto } from '../dto/request/register.request.dto.js';
import { AuthService } from '../services/auth.service.js';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() body: RegisterRequestDto): Promise<UserResponseDto> {
    const user = await this.authService.register(body.email, body.password);
    return UserMapper.toResponse(user);
  }
}
