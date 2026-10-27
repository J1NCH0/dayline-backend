import type { User } from '../../generated/prisma/client.js';
import type { UserResponseDto } from '../dto/response/user.response.dto.js';

export class UserMapper {
  static toResponse(user: User): UserResponseDto {
    return {
      id: user.id,
      email: user.email,
      createdAt: user.createdAt.toISOString(),
    };
  }
}
