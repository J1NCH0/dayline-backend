# PLAN — Backend foundation: dependencies + JWT auth with DB-backed sessions

> Target repo: `dayline-backend` (NestJS 12, TypeScript 6, **Bun 1.4** runtime).
> Status: **approved 2026-10-27**, revised the same day to run on **Bun instead of Node**. Implementation follows §8.

## Context

Dayline needs authentication before any budget data can be stored. The
SwiftUI app (iOS + macOS) is the **only** client; there's no web client
(decided 2026-10-27). The brief asks for short-lived JWT access tokens plus opaque refresh
tokens kept in DB sessions, with rotation, reuse detection and per-device
session management. The repo is a fresh `nest new` scaffold with no
database, config or auth yet.

### What exists vs. the brief (conflicts and how they're resolved)

| Item | Exists | Brief / decision |
|---|---|---|
| Runtime | Node (scaffold), local Node 25.2.1 | **Bun 1.4.4** for run, test, install and scripts (decided 2026-10-27). Smoke-tested on the scaffold: Nest 12 boots, DI and decorator metadata work, Supertest e2e passes |
| Test runner | Vitest 4 + Supertest, configured | **`bun test`** (Jest-compatible API: `describe/it/expect`, `mock`, `spyOn`) + Supertest. Replaces the earlier Jest decision; on Bun it's the native runner |
| Module system | Native ESM (`"type": "module"`, `nodenext`, `.js` imports) | **Keep ESM.** Bun runs ESM + TS directly, so the CommonJS conversion is no longer needed |
| Registration | — | **Open registration** (your choice). Rate-limited (see §7). |
| Web client | brief asks for cookie delivery | **Dropped.** Native only: refresh token always in the body; no cookies, CORS or CSRF handling |
| Session count | — | **Unlimited** active sessions per user (confirmed) |
| Local DB | none | Docker Compose for **local dev only**; production stays k3s |
| Lint/format | oxlint + Prettier | kept |

---

## 1. Summary

- Add Prisma **7.10.1** (pinned; the npm `latest` tag for the CLI is an 8.0 RC) + PostgreSQL on **Bun 1.4**, typed env config that fails fast on bad values, and global security middleware (helmet, throttling).
- Access token: HS256 JWT, 15 min, payload `{ sub, sid, iat, exp }`. Refresh token: 32-byte random opaque string, 30 days, stored only as a SHA-256 hash in `Session`.
- Every refresh rotates the token. Reusing an already-rotated token revokes the whole session.
- The refresh token is always delivered in the JSON response body. The Swift app stores it in the Keychain.
- The global guard checks the session in the DB on every request, so revoking a session takes effect immediately. Tested end-to-end with `bun test` + Supertest against a real Postgres.

## 2. Dependencies

Versions come from the npm registry on **2026-10-27** (`npm view <pkg> version` / `dist-tags`, plus peer and engine checks). Prisma packages are **pinned exactly** (see the findings below). Everything else uses `^`.

**Runtime**

| Package | Version | Reason |
|---|---|---|
| `@prisma/client` | **7.10.1** (exact) | Generated type-safe DB client |
| `@prisma/adapter-pg` | **7.10.1** (exact) | Driver adapter, **mandatory in Prisma 7**. Pulls in `pg ^8.16` |
| `pg` | ^8.23.1 | Postgres driver used by the adapter (explicit, so pool options can be set) |
| `@nestjs/config` | ^12.0.1 | Loads `.env` (bundles dotenv 18), injectable typed config |
| `class-validator` | ^0.15.1 | DTO + env validation with Nest's `ValidationPipe` |
| `class-transformer` | ^0.5.1 | Required by `ValidationPipe({ transform })`. Last release 2022, but still the version Nest declares as its peer |
| `@nestjs/jwt` | ^12.0.3 | Sign/verify HS256 access tokens. `jose` (6.2.13) isn't needed |
| `helmet` | ^8.3.0 | Secure HTTP headers |
| `@nestjs/throttler` | ^6.7.1 | Rate limiting. Its version numbers aren't aligned with Nest's (6.x), but the peer range includes Nest 12 ✅ |
| `@nestjs/schedule` | ^12.0.2 | Daily session-cleanup cron |

Already present: `@nestjs/common|core|platform-express` ^12 (latest 12.2.0, bump on install), `reflect-metadata` ^0.2.2, `rxjs` ^7.8.2.

**Provided by Bun (no package):**
- Password hashing: **`Bun.password`**, argon2id (`memoryCost: 65536`, `timeCost: 3`). Replaces the `argon2` native module, so there's no native build in Docker.
- `.env` loading.
- SHA-256: `crypto.createHash` / `Bun.CryptoHasher`.
- Random bytes: `crypto.randomBytes`.

**Dev**

| Package | Version | Reason |
|---|---|---|
| `prisma` | **7.10.1** (exact) | CLI: migrate, generate, studio |
| `@types/bun` | ^1.4.4 | Types for `Bun.*` and `bun:test` |
| `supertest` / `@types/supertest` | ^7.3.1 / ^7.2.1 | HTTP e2e (already installed, bump) |
| `@types/pg` | ^8.23.1 | Types |
| `@nestjs/cli` / `@nestjs/schematics` | ^12.0.10 / ^12.0.10 | Only `nest generate` (schematics) and `nest build` for type-checked builds. Also installed **globally** with Bun at 12.0.10 (step 0) |
| `typescript` | **^6.0.3** (stay on 6) | Used for type-checking (`tsc --noEmit`); Bun itself just strips types. Every Nest CLI release (`latest` 12.0.10, `next` 12.0.0-alpha.9) bundles `typescript ~6.0.2`, so TS 7 waits for Nest |

**Removed:** `vitest`, `@vitest/coverage-v8`, `vite-tsconfig-paths`, `vitest.config*.ts`, `package-lock.json` (→ `bun.lock`). Jest, swc, `argon2` and `dotenv` are no longer needed.

### Version research findings (affect the plan)

1. **`bun add prisma` (or `npm install prisma`) would install 8.0.0-rc.27.** The CLI's `latest` dist-tag points at a release candidate, while `@prisma/client` / `@prisma/adapter-pg` `latest` = 7.10.1 (`prev` tag = 7.10.1). → Pin all three to `7.10.1` exactly. A CLI/client version mismatch breaks `generate`.
2. **Prisma 7 changes** used in this plan (from the official Prisma 7 upgrade guide):
   - generator `prisma-client` (not `prisma-client-js`) with a **required `output`**; import from `src/generated/prisma/client`
   - DB URL moves to **`prisma.config.ts`** (`defineConfig({ datasource: { url: env('DATABASE_URL') } })`); `url` in the schema is deprecated
   - **Driver adapter required**: `new PrismaClient({ adapter: new PrismaPg({ connectionString }) })`
   - `.env` is not auto-loaded under Node. **Bun loads it automatically**, so the CLI runs via `bunx --bun prisma` and needs no dotenv
   - `migrate dev` **no longer runs `generate`** → scripts run `prisma generate` explicitly
   - `$use` middleware and metrics are removed; we don't use either
   - `pg` has **no connection timeout by default** (v6 used 5 s) → set `connectionTimeoutMillis: 5000` on the adapter
3. **Prisma 7 is ESM-first**, which matches the project. The generator is set to `runtime = "bun"`, `moduleFormat = "esm"`.
4. **Bun runtime:** local Bun is 1.3.14, latest 1.4.4 → `bun upgrade`. Pin it with `"packageManager": "bun@1.4.4"` and `"engines": { "bun": ">=1.4.4" }`. Docker uses **`oven/bun:1.4.4-slim`** (Debian-based; tag verified on Docker Hub). Production runs `bun src/main.ts` directly, with no compile step; `bun run typecheck` (`tsc --noEmit`) runs in CI.

**Why `class-validator` over `zod`:** it's built into Nest's `ValidationPipe` and decorator-based DTOs, and it covers env validation via `ConfigModule.forRoot({ validate })`. Zod would need an extra adapter (`nestjs-zod`) for the same result.

## 3. Folder structure

Layering follows [`ARCHITECTURE.md`](ARCHITECTURE.md): controllers → services → repositories (separate `@Injectable`s, the only code that uses Prisma); mappers turn entities into response DTOs; request and response DTOs are separate; tests live outside `src/`.

```
dayline-backend/
├── docker-compose.yml          # postgres (5432) + postgres-test (5433, tmpfs)
├── prisma.config.ts            # Prisma 7 config (schema path, DATABASE_URL)
├── prisma/{schema/schema.prisma, schema/models/*.prisma, migrations/}
├── .env.example
├── bunfig.toml                 # [test] timeout, e2e preload
├── src/
│   ├── main.ts                 # helmet, ValidationPipe, trust proxy, shutdown hooks (CORS off)
│   ├── app.module.ts
│   ├── generated/prisma/       # prisma generate output (git-ignored)
│   ├── config/
│   │   ├── constants/env.constants.ts       # NODE_ENVS, DURATION_PATTERN, defaults
│   │   ├── validation/env.validation.ts     # EnvironmentVariables + validateEnv()
│   │   ├── utils/duration.utils.ts          # durationToSeconds()
│   │   ├── services/app-config.service.ts   # typed getters
│   │   └── app-config.module.ts             # @Global
│   ├── prisma/
│   │   ├── services/prisma.service.ts       # PrismaClient + PrismaPg adapter, lifecycle
│   │   └── prisma.module.ts                 # @Global
│   ├── health/
│   │   ├── controllers/health.controller.ts # @Public GET /health
│   │   ├── services/health.service.ts
│   │   ├── repositories/health.repository.ts  # SELECT 1
│   │   ├── dto/response/health.response.dto.ts
│   │   └── health.module.ts
│   ├── users/
│   │   ├── repositories/users.repository.ts # findByEmail, findById, create
│   │   ├── services/users.service.ts        # register, getById, email normalization
│   │   ├── dto/response/user.response.dto.ts
│   │   ├── mappers/user.mapper.ts           # User → UserResponseDto
│   │   ├── utils/email.utils.ts             # normalizeEmail()
│   │   └── users.module.ts
│   └── auth/
│       ├── controllers/auth.controller.ts      # register/login/refresh/logout/logout-all/me
│       ├── controllers/sessions.controller.ts  # GET /auth/sessions, DELETE /auth/sessions/:id
│       ├── services/auth.service.ts            # orchestration
│       ├── services/sessions.service.ts        # create/rotate/revoke/list, reuse detection
│       ├── services/tokens.service.ts          # sign/verify access JWT
│       ├── services/password.service.ts        # Bun.password argon2id, dummy-hash timing guard
│       ├── repositories/sessions.repository.ts # all Session queries, incl. atomic rotation
│       ├── dto/request/{register,login,refresh}.request.dto.ts
│       ├── dto/response/{token-pair,session}.response.dto.ts
│       ├── mappers/session.mapper.ts           # Session (+ current sid) → SessionResponseDto
│       ├── constants/auth.constants.ts         # TTLs, grace window, error codes, throttle limits
│       ├── validation/password.validation.ts   # password length rule (shared by DTOs)
│       ├── utils/refresh-token.utils.ts        # generateRefreshToken(), hashRefreshToken()
│       ├── guards/jwt-auth.guard.ts            # global APP_GUARD
│       ├── decorators/{public,current-session}.decorator.ts
│       ├── tasks/session-cleanup.task.ts       # @Cron daily
│       └── auth.module.ts
└── test/
    ├── unit/                   # mirrors src/ (validation, utils, mappers, services with mocked repos)
    ├── e2e/                    # app.e2e.spec.ts, health.e2e.spec.ts, auth.e2e.spec.ts
    └── support/                # test app bootstrap, DB reset, register/login helpers, token signing
```

Unit tests: `bun run test` (`bun test test/unit`). E2e: `bun run test:e2e` (`bun test test/e2e`).

The guard is **global, secure by default**. Routes opt out with `@Public()`.

## 4. Prisma schema

**Implemented** (step 4). The schema is **split across files**: `prisma.config.ts` sets `schema: 'prisma/schema'`, so Prisma merges every `.prisma` file in the folder. IDs are **auto-increment integers** (decided 2026-10-27), not UUIDs.

```
prisma/schema/schema.prisma          generator + datasource
prisma/schema/models/user.prisma     model User
prisma/schema/models/session.prisma  model Session
prisma/migrations/20261027003149_init/migration.sql
```

```prisma
generator client {
  provider     = "prisma-client"            // Prisma 7 generator
  output       = "../../src/generated/prisma"  // required; git-ignored, built by `prisma generate`
  runtime      = "bun"
  moduleFormat = "esm"                      // project is ESM
}

datasource db {
  provider = "postgresql"
}

model User {
  id           Int       @id @default(autoincrement())
  email        String    @unique              // stored lower-cased + trimmed
  passwordHash String
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt
  sessions     Session[]

  @@map("users")
}

model Session {
  id                Int       @id @default(autoincrement())
  userId            Int
  user              User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  refreshTokenHash  String    @unique          // SHA-256 hex of current refresh token
  previousTokenHash String?   @unique          // hash of the token it replaced (reuse detection)
  rotatedAt         DateTime?                  // when previousTokenHash was set (race grace window)
  userAgent         String?
  ipAddress         String?
  deviceName        String?
  createdAt         DateTime  @default(now())
  lastUsedAt        DateTime  @default(now())
  expiresAt         DateTime
  revokedAt         DateTime?

  @@index([userId, revokedAt, expiresAt])      // list active sessions, logout-all
  @@index([expiresAt])                          // cleanup job
  @@index([revokedAt])                          // cleanup job
  @@map("sessions")
}
```

The `//` notes above are for this plan only; the real `.prisma` files have no comments.

Notes: `@unique` on both hash columns gives indexed O(1) lookups.
Integer IDs are sequential and guessable, so every session query also filters by the caller's `userId` (another user's id → 404). The real secret is the refresh token. JWT payload: `sub` and `sid` are numbers.
`rotatedAt` is one field added beyond the brief, needed for the race
grace window in §5.4. The connection URL lives in `prisma.config.ts`
(Prisma 7 style), not in the schema.

## 5. Auth flows

### 5.1 Token delivery
Native client only, so there's one path. The refresh token is returned in the JSON body (`refreshToken`) on login/refresh and sent back in the body on `/auth/refresh`. The Swift app stores it in the **Keychain** (`kSecAttrAccessibleAfterFirstUnlockThisDeviceOnly`) and the access token in memory.

No cookies, so there's no CSRF surface. CORS stays disabled, since browsers aren't a client. If a web client is ever added, cookie delivery can be layered on later without changing the session model.

### 5.2 Login
```
normalize email → user = findByEmail
if !user: Bun.password.verify(pw, DUMMY_HASH) (equal timing) → 401 "Invalid email or password"
if !verify(user.passwordHash, pw) → 401 same message
raw = randomBytes(32).base64url ; hash = sha256(raw)
session = create{ userId, refreshTokenHash: hash, userAgent, ip, deviceName, expiresAt: now+30d }
access = jwt.sign({ sub: user.id, sid: session.id }, 15m)
→ 200 { accessToken, expiresIn: 900, refreshToken: raw }
```

### 5.3 Authenticated request (global guard)
```
skip if @Public
token = Bearer header → jwt.verify(token, { clockTolerance: 30s, algorithms: ['HS256'] }) else 401
session = findUnique(id = payload.sid)
if !session || session.userId != sub || revokedAt || expiresAt < now → 401
attach { userId, sessionId } to request
```
`lastUsedAt` is updated on refresh only, not on every request, to avoid a write per request.

### 5.4 Refresh (rotation + reuse detection)
```
raw = body.refreshToken; missing → 400 (validation)
h = sha256(raw)
s = findUnique(refreshTokenHash = h)
if s:
   if revoked/expired → 401
   newRaw = random(32); newH = sha256(newRaw)
   n = updateMany(where { id: s.id, refreshTokenHash: h, revokedAt: null },
                  data  { previousTokenHash: h, refreshTokenHash: newH, rotatedAt: now, lastUsedAt: now })
   if n == 0 → 401   // lost a concurrent rotation
   return new access (same sid) + newRaw
old = findUnique(previousTokenHash = h)
if old:                                    // REUSE of a rotated token
   if now - old.rotatedAt < 10s → 401 "refresh_in_progress" (no revoke: app made two refreshes at once)
   revoke(old.id) ; log security event → 401 "session_revoked"
→ 401 (unknown token)
```
Limitation: only the **previous** token is remembered. Reusing a token
two or more rotations old looks like an unknown token (401, no revoke).
That's acceptable because an older token is useless anyway. The access
tokens of a revoked session stop working immediately, because the guard
checks the DB (§5.3).

### 5.5 Logout / logout-all / revoke one
- `logout`: set `revokedAt = now` on the current `sid` (from the access token). The app deletes its Keychain entry.
- `logout-all`: `updateMany({ userId, revokedAt: null }) → revokedAt = now`, including the current session.
- `DELETE /auth/sessions/:id`: `updateMany({ id, userId: me, revokedAt: null })`. 0 rows → 404, so other users' session IDs aren't exposed.

## 6. Endpoints

| Method | Path | Auth | Request | Response | Errors |
|---|---|---|---|---|---|
| POST | `/auth/register` | public | `{ email, password }` | 201 `{ id, email, createdAt }` (no auto-login) | 400 validation · 409 email taken · 429 |
| POST | `/auth/login` | public | `{ email, password, deviceName? }` | 200 `{ accessToken, expiresIn, refreshToken }` | 400 · 401 generic · 429 |
| POST | `/auth/refresh` | public (refresh token) | `{ refreshToken }` | 200 same shape as login | 400 · 401 invalid/expired/revoked/reused · 429 |
| POST | `/auth/logout` | bearer | — | 204 | 401 |
| POST | `/auth/logout-all` | bearer | — | 204 | 401 |
| GET | `/auth/sessions` | bearer | — | 200 `[{ id, deviceName, userAgent, ipAddress, createdAt, lastUsedAt, expiresAt, current: bool }]` | 401 |
| DELETE | `/auth/sessions/:id` | bearer | `:id` positive integer | 204 | 400 bad id · 401 · 404 |
| GET | `/auth/me` | bearer | — | 200 `{ id, email, createdAt }` | 401 |
| GET | `/health` | public | — | 200 `{ status: "ok" }` | — |

Error body (Nest default): `{ statusCode, message, error }`. Refresh 401s carry a machine-readable `code` (`invalid_token` / `session_revoked` / `refresh_in_progress`), so the app knows whether to send the user back to login.

## 7. Decisions

1. **Check the session in the DB on every request: yes.** It's one primary-key lookup on an indexed table, and Dayline is a single-user, low-traffic app. In return, logout, logout-all and reuse detection take effect instantly instead of up to 15 minutes later. Trade-off: one extra query per request. If traffic ever grows, add a short in-memory cache (≤30 s) of revoked session IDs.
2. **Cleanup: scheduled job plus checks on read.** Expired or revoked sessions are always rejected when read. A daily `@Cron('0 4 * * *')` job deletes sessions where `expiresAt < now − 7d` or `revokedAt < now − 7d`; the 7 days keep recent sessions for forensics. This runs in-app because there's a single replica. If the deployment scales beyond one pod, move it to a k8s CronJob.
3. **Rate limits** (`@nestjs/throttler`, keyed by client IP; `app.set('trust proxy', 1)` behind Traefik):
   - login: **5 / min per IP**, plus 10 failures per 15 min per email → 429
   - register: **3 / hour per IP**
   - refresh: **30 / min per IP**
   - global default: **100 / min**
4. **Passwords and login failures:**
   - Length 12–128, no composition rules (NIST 800-63B). The 128 cap bounds hashing cost.
   - argon2id via `Bun.password` (m=64 MiB, t=3).
   - Login always answers "Invalid email or password", and runs a verify against a dummy hash when the user doesn't exist, so timing doesn't reveal which emails are registered.
   - Register *must* return 409 for an existing email under open registration. This leaks whether an email exists, which is accepted and limited by the 3/hour rate limit.
5. **Clock skew: `clockTolerance: 30s`** on JWT verify. That covers device and server drift without meaningfully extending the 15-minute window. Pin `algorithms: ['HS256']`. Startup validation rejects a `JWT_ACCESS_SECRET` shorter than 32 bytes.

### `.env.example`
```
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://dayline:dayline@localhost:5432/dayline
JWT_ACCESS_SECRET=change-me-to-64-random-bytes-base64
JWT_ACCESS_TTL=15m
REFRESH_TOKEN_TTL_DAYS=30
TRUST_PROXY=1
```
`.env.test` (git-ignored) points `DATABASE_URL` at `localhost:5433/dayline_test`.

### Scripts (`bun run <name>`)
`start` (`bun src/main.ts`) · `start:dev` (`bun --watch src/main.ts`) · `typecheck` (`tsc --noEmit`) · `db:up` / `db:down` (compose) · `prisma:generate` · `prisma:migrate` (`migrate dev`) · `prisma:deploy` (`migrate deploy`, used by the k3s Job) · `prisma:studio` · `postinstall: prisma generate` · `test` (`bun test test/unit`) · `test:e2e` (`prisma migrate reset --force` on the test DB → `bun test test/e2e`; Bun loads `.env.test` when `NODE_ENV=test`) · `test:cov` (`bun test --coverage`). All Prisma commands run as `bunx --bun prisma …`.

**Migration workflow:** edit a file in `prisma/schema/` → `bun run prisma:migrate --name <change>` → commit `prisma/migrations/*`. Production applies migrations with `prisma migrate deploy` only, never `migrate dev`.

## 8. Implementation order (each step builds and is tested before the next)

0. **Runtime + global CLI.** `bun upgrade` to 1.4.4. Set `packageManager` / `engines.bun`. Install the Nest CLI globally: `bun add -g @nestjs/cli@12.0.10`. ✅ `bun --version` → 1.4.4, `nest --version` → 12.0.10.
1. **Bun switch.** Replace `package-lock.json` with `bun.lock`. Remove Vitest and its configs. Add `@types/bun` and switch tsconfig `types` to `["bun"]`. Rename the e2e spec to `*.e2e.spec.ts`. Scripts as above. ✅ `bun run test`, `bun run test:e2e` and `bun run typecheck` pass; `bun run start` serves `/`.
2. **Config.** `@nestjs/config` + `env.validation.ts` + `.env.example`. ✅ The app refuses to start with a missing or short `JWT_ACCESS_SECRET`; unit test for the validator.
3. **Local Postgres.** `docker-compose.yml` (dev + test DBs) and the `db:*` scripts. ✅ `bun run db:up`, both DBs reachable.
4. **Prisma.** `prisma.config.ts`, schema (§4), first migration, global `PrismaService`. ✅ Migration applies; `/health` returns ok and runs a `SELECT 1`.
5. **App hardening in `main.ts`.** helmet, global `ValidationPipe({ whitelist, forbidNonWhitelisted, transform })`, trust proxy, throttler module. ✅ e2e: security headers present, unknown fields → 400.
6. **Users + password service.** `Bun.password` argon2id hash/verify, email normalization. ✅ Unit tests.
7. **Register.** ✅ e2e: 201, duplicate → 409, weak password → 400.
8. **Tokens service + login.** Session creation, body delivery. ✅ e2e: login returns access + refresh tokens; only the hash is stored in the DB; bad credentials → generic 401.
9. **Global JWT guard + `@Public` + `GET /auth/me`.** ✅ e2e: no token / bad token / expired token → 401; valid → 200.
10. **Refresh with rotation, reuse detection and grace window.** ✅ e2e (§9).
11. **Logout, logout-all, sessions list/revoke.** ✅ e2e (§9).
12. **Rate limits on auth routes.** ✅ e2e: 6th login within a minute → 429.
13. **Cleanup cron.** ✅ Unit test of the delete query, using a frozen date.
14. **Write `docs/PLAN-auth.md` → `docs/AUTH.md`** with the final API contract for the Swift client.

## 9. Testing plan (`bun test` + Supertest, real Postgres test DB; e2e files run sequentially in one process)

- **Login:** success (tokens in the body, the DB stores the SHA-256 hash and never the raw token); several logins create separate sessions with no cap; wrong password → 401; unknown email → 401 with the same message; validation errors → 400.
- **Access token expiry:** a token signed by the test with `exp` 10 s ago → 200 (inside the 30 s tolerance); 60 s ago → 401; tampered signature → 401; `alg: none` → 401.
- **Refresh rotation:** refresh returns a new token different from the old; the old token is no longer valid; the new one works; `lastUsedAt` updated.
- **Reuse detection:** refresh with A → B; present A again more than 10 s later (time controlled by stubbing `rotatedAt`) → 401 `session_revoked`, and B is also rejected; the session's access token on `/auth/me` → 401.
- **Race grace:** present A again within 10 s → 401 `refresh_in_progress`; the session isn't revoked and B still works.
- **Logout:** revokes only the current session; that access token → 401; another session still works.
- **Logout-all:** every session's access and refresh tokens → 401.
- **Revoke another session:** user lists sessions (`current: true` on its own), deletes session 2 → session 2 tokens → 401, session 1 fine; deleting another user's session ID → 404.
- **Revoked-session access:** revoke a session in the DB directly → its still-unexpired JWT on `/auth/me` → 401.
- **Rate limit:** 6 rapid logins → 429.

## 10. Open questions

**Resolved 2026-10-27:**
- ~~Runtime~~ → **Bun 1.4.4** instead of Node; test runner **`bun test`** (replaces the Jest/CommonJS decision; project stays ESM).
- ~~Web client~~ → **none**. Native only, body delivery, no cookies or CORS.
- ~~Session cap~~ → **unlimited** sessions per user.
- ~~Docker base / argon2 native module~~ → `oven/bun:1.4.4-slim`; hashing uses the built-in `Bun.password`, so there's no native module.

**Still open:**
1. **Open registration on a public server:** fine with the 409 email leak and anyone being able to create accounts (rate-limited), or add a simple `REGISTRATION_ENABLED` kill switch later?
