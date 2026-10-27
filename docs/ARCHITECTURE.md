# Backend architecture

Every feature module is split into **layers**, one folder per layer. A folder exists only when the module needs that layer.

```
src/<module>/
├── controllers/      # HTTP only: routes, status codes, guards
├── services/         # business logic; orchestrates repositories
├── repositories/     # the ONLY code that talks to Prisma / the database
│   └── inputs/       # repository parameter types: <name>.input.ts (CreateUserInput)
├── mappers/          # entity (Prisma model) → response DTO
├── dto/
│   ├── request/      # incoming bodies/params, validated with class-validator
│   └── response/     # outgoing shapes, the public API contract
├── constants/        # one constant per file: <name>.constant.ts
├── types/            # one type per file: <name>.type.ts
├── validation/       # custom validators, env schema (not DTOs); one class or function per file
├── utils/            # pure functions, one per file: <name>.util.ts; no DI, no I/O
├── guards/ decorators/ tasks/   # Nest extras, only when needed
└── <module>.module.ts
```

## Request flow

```
HTTP request
   │  body/params validated into a Request DTO (ValidationPipe)
   ▼
controller ──▶ service ──▶ repository ──▶ PrismaService ──▶ Postgres
   ▲              │             │
   │              │             └─ returns entities (Prisma types)
   │              └─ returns entities / domain results
   │
   └─ mapper: entity ──▶ Response DTO ──▶ HTTP response
```

- **Controllers** receive request DTOs, call one service method, and turn the result into a response DTO with a mapper. They contain no business logic.
- **Services** work with entities and return entities. They never build HTTP responses, so they can be reused by other services, cron tasks and tests.
- **Mappers** are the only place an entity becomes a response DTO. Prisma entities never leave the API unmapped, so a new database column (e.g. `passwordHash`) can't leak by accident.

## Dependency rules

| Layer | May depend on | Must not |
|---|---|---|
| controllers | services, mappers, request/response DTOs, constants | repositories, `PrismaService`, business rules |
| services | repositories, other services, utils, constants | `PrismaService` / Prisma delegates, response DTOs, mappers |
| repositories | `PrismaService`, generated Prisma types, constants | HTTP exceptions, business rules, DTOs |
| mappers | entities (Prisma types), response DTOs | services, repositories, I/O |
| dto/request | class-validator, validation, constants | services, entities |
| dto/response | — (plain classes) | entities, Prisma types |
| validation | constants | services, repositories |
| utils | constants | Nest DI, I/O, `process.env` |

### Repositories are separate injectable classes

Services do **not** get a Prisma delegate or an `@InjectRepository(...)` (the pattern from the Nest docs). Each aggregate has its own repository class:

```ts
// src/users/repositories/users.repository.ts
@Injectable()
export class UsersRepository {
  constructor(private readonly prisma: PrismaService) {}

  findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { email } });
  }
}

// src/users/services/users.service.ts
@Injectable()
export class UsersService {
  constructor(private readonly usersRepository: UsersRepository) {}
}
```

Services stay database-agnostic and easy to unit test, because the repository is replaced by a plain mock. All queries for a table live in one place, and transactions stay inside repositories.

### Data shapes per layer boundary

| Boundary | Shape | Lives in | Example |
|---|---|---|---|
| HTTP → controller | request DTO (class, validated) | `dto/request/` | `RegisterRequestDto { email, password }` |
| service → repository | repository input (plain type) | `repositories/inputs/` | `CreateUserInput { email, passwordHash }` |
| repository → service | entity (generated Prisma type) | `src/generated/prisma` | `User` |
| controller → HTTP | response DTO (via mapper) | `dto/response/` | `UserResponseDto { id, email, createdAt }` |

Repository inputs are our own types, not Prisma's generated `Prisma.*CreateInput`, so services never import Prisma.

### DTOs and mappers

```ts
// src/auth/dto/request/login.request.dto.ts
export class LoginRequestDto {
  @IsEmail() email: string;
  @IsString() @Length(12, 128) password: string;
  @IsOptional() @IsString() @MaxLength(100) deviceName?: string;
}

// src/users/dto/response/user.response.dto.ts
export class UserResponseDto {
  id: string;
  email: string;
  createdAt: string; // ISO 8601
}

// src/users/mappers/user.mapper.ts
export class UserMapper {
  static toResponse(user: User): UserResponseDto {
    return { id: user.id, email: user.email, createdAt: user.createdAt.toISOString() };
  }
}

// controller
@Get('me')
async me(@CurrentSession() session: SessionContext): Promise<UserResponseDto> {
  return UserMapper.toResponse(await this.usersService.getById(session.userId));
}
```

Mappers are plain classes with static methods. They're pure, with no DI, so they're unit-tested without a Nest module.

## Naming

| Layer | File | Export |
|---|---|---|
| controller | `auth.controller.ts` | `AuthController` |
| service | `sessions.service.ts` | `SessionsService` |
| repository | `sessions.repository.ts` | `SessionsRepository` |
| mapper | `session.mapper.ts` | `SessionMapper` (`toResponse`, `toResponseList`) |
| request DTO | `login.request.dto.ts` | `LoginRequestDto` |
| response DTO | `token-pair.response.dto.ts` | `TokenPairResponseDto` |
| constants | **one file per constant**: `refresh-grace-window.constant.ts` | `REFRESH_GRACE_WINDOW_SECONDS` (`UPPER_SNAKE_CASE`) |
| validation | `environment-variables.validation.ts`, `validate-env.validation.ts` | `EnvironmentVariables` · `validateEnv` |
| utils | `duration-to-seconds.util.ts` | `durationToSeconds` |
| types | `node-env.type.ts` | `NodeEnv` |

**One export per file.** Every class, function, constant and type gets its own file, named after the export. A class and a function never share a file, and neither do two constants.

Imports use the `.js` extension (ESM): `import { UsersService } from '../services/users.service.js';`

## Tests

Tests are a separate layer outside `src/`:

```
test/
├── unit/       # mirrors src/: test/unit/config/validation/env.validation.spec.ts
├── e2e/        # HTTP + real Postgres: test/e2e/auth.e2e.spec.ts
└── support/    # shared helpers, factories, test app bootstrap
```

- `bun run test` runs `test/unit`; `bun run test:e2e` runs `test/e2e`.
- Unit tests mock repositories, never Prisma. Mappers, utils and validation are tested directly. E2e tests use the real test database.
- Test functions are imported from `bun:test`; there are no globals.
