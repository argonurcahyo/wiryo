// scripts/migrate-to-turso.mjs
// Run: node scripts/migrate-to-turso.mjs
import { createClient } from "@libsql/client";

const LOCAL_URL = "file:dev.db";
const REMOTE_URL = "libsql://wiryo-vercel-icfg-uf1d1wx3l2mmxrn4du4n6bfg.aws-us-east-1.turso.io";
const REMOTE_TOKEN = "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE3NzUwMTMwODMsImlkIjoiMDE5ZDQ3MDYtMzkwMS03NWRkLWI4YTAtYThkNjQ3ODkxMzMxIiwicmlkIjoiNmYyNTM5ZTItMjlkYi00NzkwLTkwYzAtZmU0ZDc2ODliNTFkIn0.2E8AaK-3juY4TP027sbA30jy73Vip5adzMiSNmX32qceBzDTT-GLz7aOIkacqO7JjGenXurRfsORFj0GeVKKCw";

const local = createClient({ url: LOCAL_URL });
const remote = createClient({ url: REMOTE_URL, authToken: REMOTE_TOKEN });

console.log("🔧 Creating tables on remote...");
await remote.executeMultiple(`
  CREATE TABLE IF NOT EXISTS members (
    id        TEXT PRIMARY KEY,
    name      TEXT NOT NULL,
    fatherId  TEXT,
    motherId  TEXT,
    birthDate TEXT,
    spouseId  TEXT,
    gender    TEXT,
    createdAt TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS partner_relationships (
    id        TEXT PRIMARY KEY,
    memberAId TEXT NOT NULL,
    memberBId TEXT NOT NULL,
    status    TEXT NOT NULL DEFAULT 'current',
    createdAt TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(memberAId, memberBId)
  );
  CREATE INDEX IF NOT EXISTS idx_partner_relationships_memberA ON partner_relationships(memberAId);
  CREATE INDEX IF NOT EXISTS idx_partner_relationships_memberB ON partner_relationships(memberBId);
`);

const { rows: members } = await local.execute("SELECT * FROM members");
console.log(`📦 Migrating ${members.length} members...`);
if (members.length > 0) {
  await remote.batch(
    members.map((m) => ({
      sql: `INSERT OR REPLACE INTO members (id, name, fatherId, motherId, birthDate, spouseId, gender, createdAt)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [m.id, m.name, m.fatherId, m.motherId, m.birthDate, m.spouseId, m.gender, m.createdAt],
    })),
    "write"
  );
}

const { rows: rels } = await local.execute("SELECT * FROM partner_relationships");
console.log(`🔗 Migrating ${rels.length} relationships...`);
if (rels.length > 0) {
  await remote.batch(
    rels.map((r) => ({
      sql: `INSERT OR REPLACE INTO partner_relationships (id, memberAId, memberBId, status, createdAt)
            VALUES (?, ?, ?, ?, ?)`,
      args: [r.id, r.memberAId, r.memberBId, r.status, r.createdAt],
    })),
    "write"
  );
}

console.log("✅ Migration complete!");
