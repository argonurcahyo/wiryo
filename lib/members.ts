/**
 * lib/members.ts
 * CRUD helpers for the `members` table.
 * All functions run server-side only.
 */

import { db, initDb } from "./db";
import { v4 as uuidv4 } from "uuid";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Member {
  id: string;
  name: string;
  fatherId: string | null;
  motherId: string | null;
  birthDate: string | null;
  createdAt?: string;
}

export interface CreateMemberInput {
  name: string;
  fatherId?: string | null;
  motherId?: string | null;
  birthDate?: string | null;
}

export interface UpdateMemberInput {
  name?: string;
  fatherId?: string | null;
  motherId?: string | null;
  birthDate?: string | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Convert a raw libSQL row to a typed Member. */
function rowToMember(row: Record<string, unknown>): Member {
  return {
    id: row.id as string,
    name: row.name as string,
    fatherId: (row.fatherId as string | null) ?? null,
    motherId: (row.motherId as string | null) ?? null,
    birthDate: (row.birthDate as string | null) ?? null,
    createdAt: (row.createdAt as string | undefined),
  };
}

/**
 * Detects if adding / updating `childId` with the given parents would create a
 * cycle (i.e. an ancestor would become a descendant).
 *
 * Strategy: walk upward from each proposed parent; if we ever reach `childId`
 * we have a cycle.
 */
async function wouldCreateCycle(
  members: Member[],
  childId: string,
  parentIds: (string | null | undefined)[]
): Promise<boolean> {
  const map = new Map(members.map((m) => [m.id, m]));

  function hasAncestor(nodeId: string, target: string, visited = new Set<string>()): boolean {
    if (nodeId === target) return true;
    if (visited.has(nodeId)) return false;
    visited.add(nodeId);
    const node = map.get(nodeId);
    if (!node) return false;
    if (node.fatherId && hasAncestor(node.fatherId, target, visited)) return true;
    if (node.motherId && hasAncestor(node.motherId, target, visited)) return true;
    return false;
  }

  for (const pid of parentIds) {
    if (!pid) continue;
    // The proposed parent must not already be a descendant of childId
    if (hasAncestor(pid, childId, new Set())) return true;
  }
  return false;
}

// ─── CRUD ─────────────────────────────────────────────────────────────────────

/** Return every member, ordered by name. */
export async function getAllMembers(): Promise<Member[]> {
  await initDb();
  const result = await db.execute("SELECT * FROM members ORDER BY name");
  return result.rows.map((r) => rowToMember(r as Record<string, unknown>));
}

/** Return a single member by id, or null if not found. */
export async function getMemberById(id: string): Promise<Member | null> {
  await initDb();
  const result = await db.execute({
    sql: "SELECT * FROM members WHERE id = ?",
    args: [id],
  });
  if (result.rows.length === 0) return null;
  return rowToMember(result.rows[0] as Record<string, unknown>);
}

/** Create a new member. Throws on validation failure. */
export async function createMember(input: CreateMemberInput): Promise<Member> {
  await initDb();

  const name = input.name.trim();
  if (!name) throw new Error("Name is required.");

  const id = uuidv4();

  // Self-reference guard (not strictly possible on create but be defensive)
  if (input.fatherId === id || input.motherId === id) {
    throw new Error("A member cannot be their own parent.");
  }

  // Cycle check
  const all = await getAllMembers();
  if (await wouldCreateCycle(all, id, [input.fatherId, input.motherId])) {
    throw new Error("This relation would create a cycle in the family tree.");
  }

  await db.execute({
    sql: `INSERT INTO members (id, name, fatherId, motherId, birthDate)
          VALUES (?, ?, ?, ?, ?)`,
    args: [
      id,
      name,
      input.fatherId ?? null,
      input.motherId ?? null,
      input.birthDate ?? null,
    ],
  });

  return (await getMemberById(id))!;
}

/** Update an existing member. Throws on validation failure or not found. */
export async function updateMember(
  id: string,
  input: UpdateMemberInput
): Promise<Member> {
  await initDb();

  const existing = await getMemberById(id);
  if (!existing) throw new Error(`Member ${id} not found.`);

  const name = (input.name ?? existing.name).trim();
  if (!name) throw new Error("Name is required.");

  const fatherId = "fatherId" in input ? input.fatherId : existing.fatherId;
  const motherId = "motherId" in input ? input.motherId : existing.motherId;

  // Self-reference guard
  if (fatherId === id || motherId === id) {
    throw new Error("A member cannot be their own parent.");
  }

  // Cycle check: temporarily remove the member from the list so the walk
  // starts fresh, then check the proposed parents.
  const all = await getAllMembers();
  const withoutSelf = all.filter((m) => m.id !== id);
  if (await wouldCreateCycle(withoutSelf, id, [fatherId, motherId])) {
    throw new Error("This relation would create a cycle in the family tree.");
  }

  await db.execute({
    sql: `UPDATE members
          SET name = ?, fatherId = ?, motherId = ?, birthDate = ?
          WHERE id = ?`,
    args: [name, fatherId ?? null, motherId ?? null, input.birthDate ?? existing.birthDate ?? null, id],
  });

  return (await getMemberById(id))!;
}

/** Delete a member by id. Returns true if a row was deleted. */
export async function deleteMember(id: string): Promise<boolean> {
  await initDb();

  // Nullify parent references in children before deleting
  await db.execute({
    sql: "UPDATE members SET fatherId = NULL WHERE fatherId = ?",
    args: [id],
  });
  await db.execute({
    sql: "UPDATE members SET motherId = NULL WHERE motherId = ?",
    args: [id],
  });

  const result = await db.execute({
    sql: "DELETE FROM members WHERE id = ?",
    args: [id],
  });

  return (result.rowsAffected ?? 0) > 0;
}
