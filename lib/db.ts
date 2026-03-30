/**
 * lib/db.ts
 * Turso (libSQL) client singleton.
 *
 * Required environment variables (add to .env.local):
 *   TURSO_DATABASE_URL  – e.g. libsql://your-db.turso.io
 *   TURSO_AUTH_TOKEN    – auth token from `turso db tokens create <db>`
 *
 * For local development without a Turso account you can use an embedded SQLite
 * file by setting:
 *   TURSO_DATABASE_URL=file:./dev.db
 *   TURSO_AUTH_TOKEN=   (leave empty)
 */

import { createClient } from "@libsql/client";

// Re-use a single client across hot-reloads in dev (Next.js module caching)
const globalForDb = globalThis as unknown as { db: ReturnType<typeof createClient> | undefined };

export const db =
  globalForDb.db ??
  createClient({
    url: process.env.TURSO_DATABASE_URL ?? "file:./dev.db",
    authToken: process.env.TURSO_AUTH_TOKEN,
  });

if (process.env.NODE_ENV !== "production") globalForDb.db = db;

/**
 * Ensures the `members` table exists.
 * Call this once at startup (e.g. in instrumentation.ts or the first API call).
 */
export async function initDb(): Promise<void> {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS members (
      id        TEXT PRIMARY KEY,
      name      TEXT NOT NULL,
      fatherId  TEXT,
      motherId  TEXT,
      birthDate TEXT,
      createdAt TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);
}
