import { describe, expect, it } from 'bun:test';

const MAIN_ENTRY = new URL('../../src/main.ts', import.meta.url).pathname;

async function startAppWith(overrides: Record<string, string>) {
  const child = Bun.spawn(['bun', MAIN_ENTRY], {
    env: { ...process.env, PORT: '0', ...overrides },
    stdout: 'pipe',
    stderr: 'pipe',
  });
  const exitCode = await Promise.race([
    child.exited,
    Bun.sleep(5000).then(() => {
      child.kill();
      return null;
    }),
  ]);
  const stderr = await new Response(child.stderr).text();
  return { exitCode, stderr };
}

describe('startup config validation (e2e)', () => {
  it('exits when JWT_ACCESS_SECRET is too short', async () => {
    const { exitCode, stderr } = await startAppWith({
      JWT_ACCESS_SECRET: 'too-short',
    });

    expect(exitCode).not.toBe(0);
    expect(exitCode).not.toBeNull();
    expect(stderr).toContain('JWT_ACCESS_SECRET must be at least 32 characters');
  });

  it('exits when DATABASE_URL is not a postgres URL', async () => {
    const { exitCode, stderr } = await startAppWith({
      DATABASE_URL: 'mysql://localhost/db',
    });

    expect(exitCode).not.toBe(0);
    expect(exitCode).not.toBeNull();
    expect(stderr).toContain('DATABASE_URL must be a postgres');
  });
});
