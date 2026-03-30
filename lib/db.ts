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
import path from "path";

// Re-use a single client across hot-reloads in dev (Next.js module caching)
const globalForDb = globalThis as unknown as { db: ReturnType<typeof createClient> | undefined };

/**
 * Resolve the DB URL:
 * - If the URL starts with "file:" and is NOT an absolute path, convert it to
 *   an absolute path anchored at the project root (process.cwd()).
 *   This prevents libsql from resolving relative to a random CWD inside Next.js.
 * - Remote libsql:// / http:// URLs are passed through unchanged.
 */
function resolveDbUrl(raw: string): string {
  if (raw.startsWith("file:")) {
    const filePart = raw.slice(5); // strip "file:"
    // Already absolute (Unix /... or Windows C:\... or \\...)
    if (path.isAbsolute(filePart)) return raw;
    // Relative → make absolute from project root
    const absolute = path.resolve(process.cwd(), filePart);
    return `file:${absolute}`;
  }
  return raw;
}

const rawUrl = process.env.TURSO_DATABASE_URL ?? "file:dev.db";

export const db =
  globalForDb.db ??
  createClient({
    url: resolveDbUrl(rawUrl),
    // Pass undefined (not "") when the token is missing — libsql rejects empty strings
    authToken: process.env.TURSO_AUTH_TOKEN || undefined,
  });

if (process.env.NODE_ENV !== "production") globalForDb.db = db;

/**
 * Ensures the `members` table exists.
 * Call this once at startup (e.g. in instrumentation.ts or the first API call).
 */
export async function initDb(): Promise<void> {
  if (process.env.NODE_ENV !== "production") {
    console.log("[db] connecting to:", resolveDbUrl(rawUrl));
  }
  await db.execute(`
    CREATE TABLE IF NOT EXISTS members (
      id        TEXT PRIMARY KEY,
      name      TEXT NOT NULL,
      fatherId  TEXT,
      motherId  TEXT,
      birthDate TEXT,
      spouseId  TEXT,
      gender    TEXT,
      createdAt TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);
  // Migrate existing databases that were created before spouseId was added
  try {
    await db.execute("ALTER TABLE members ADD COLUMN spouseId TEXT");
  } catch {
    // Column already exists — safe to ignore
  }
  try {
    await db.execute("ALTER TABLE members ADD COLUMN gender TEXT");
  } catch {
    // Column already exists — safe to ignore
  }

  await db.execute(`
    CREATE TABLE IF NOT EXISTS partner_relationships (
      id        TEXT PRIMARY KEY,
      memberAId TEXT NOT NULL,
      memberBId TEXT NOT NULL,
      status    TEXT NOT NULL DEFAULT 'current',
      createdAt TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(memberAId, memberBId)
    )
  `);
  await db.execute(
    "CREATE INDEX IF NOT EXISTS idx_partner_relationships_memberA ON partner_relationships(memberAId)"
  );
  await db.execute(
    "CREATE INDEX IF NOT EXISTS idx_partner_relationships_memberB ON partner_relationships(memberBId)"
  );

  await db.execute(`
    INSERT OR IGNORE INTO partner_relationships (id, memberAId, memberBId, status)
    SELECT
      lower(hex(randomblob(16))),
      CASE WHEN id < spouseId THEN id ELSE spouseId END,
      CASE WHEN id < spouseId THEN spouseId ELSE id END,
      'current'
    FROM members
    WHERE spouseId IS NOT NULL
      AND spouseId != ''
      AND spouseId != id
  `);
}
