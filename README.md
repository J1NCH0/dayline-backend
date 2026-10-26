# dayline-backend

NestJS API for [Dayline](../README.md): pay periods, the daily-limit engine, payment capture, loans and the MiniMax-powered document extraction.

> Early development. This is currently the default NestJS scaffold.

## Stack

- NestJS (TypeScript)
- Prisma + PostgreSQL *(coming in M1)*
- Vitest for unit and e2e tests
- Oxlint + Prettier

## Setup

```sh
npm install
```

## Run

```sh
npm run start         # once
npm run start:dev     # watch mode
npm run start:prod    # from dist/ (run `npm run build` first)
```

The API listens on `http://localhost:3000`.

## Test

```sh
npm test              # unit tests
npm run test:e2e      # end-to-end tests
npm run test:cov      # coverage
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
