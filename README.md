# dayline-backend

NestJS API for [Dayline](../README.md): pay periods, the daily-limit engine, payment capture, loans and the MiniMax-powered document extraction.

> Early development. This is currently the default NestJS scaffold.

## Stack

- [Bun](https://bun.com) 1.4 runtime, package manager and test runner
- NestJS 12 (TypeScript, ESM)
- Prisma + PostgreSQL *(coming in M1)*
- `bun test` + Supertest for unit and e2e tests
- Oxlint + Prettier

## Setup

Requires **Bun ≥ 1.4.4** (`curl -fsSL https://bun.com/install | bash`, or `bun upgrade`).

```sh
bun install
```

## Run

```sh
bun run start         # run src/main.ts directly (no build step)
bun run start:dev     # watch mode
bun run typecheck     # tsc --noEmit
```

The API listens on `http://localhost:3000`.

## Test

```sh
bun run test          # unit tests   (test/unit)
bun run test:e2e      # end-to-end   (test/e2e)
bun run test:cov      # coverage
```

## Configuration

Configuration will be read from environment variables (`.env` locally, Kubernetes Secrets in production):

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | Signing key for app auth |
| `MINIMAX_API_KEY` | MiniMax API key |
| `MINIMAX_MODEL` | MiniMax model id |

Never commit `.env`. It's already in `.gitignore`.

## Deployment

Runs on k3s (Kubernetes) on Hetzner. Manifests will be added with M1.

## License

[MIT](LICENSE)

Code layout and conventions: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).
