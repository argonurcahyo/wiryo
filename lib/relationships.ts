import { v4 as uuidv4 } from "uuid";
import { db, initDb } from "./db";
import type { CreateRelationshipInput, PartnerRelationship, RelationshipStatus } from "./relationship-utils";

// Re-export types and pure utils for backward compatibility.
export type { RelationshipStatus, PartnerRelationship, CreateRelationshipInput, MemberPartnerSummary } from "./relationship-utils";
export { getPartnerId, getChildrenForPair, getMemberPartnerSummaries } from "./relationship-utils";

function normalizePair(memberAId: string, memberBId: string) {
  return memberAId < memberBId
    ? { memberAId, memberBId }
    : { memberAId: memberBId, memberBId: memberAId };
}

function rowToRelationship(row: Record<string, unknown>): PartnerRelationship {
  return {
    id: row.id as string,
    memberAId: row.memberAId as string,
    memberBId: row.memberBId as string,
    status: ((row.status as string | undefined) ?? "current") as RelationshipStatus,
    createdAt: row.createdAt as string | undefined,
  };
}

export async function getAllRelationships(): Promise<PartnerRelationship[]> {
  await initDb();
  const result = await db.execute(
    `SELECT * FROM partner_relationships
     ORDER BY CASE status WHEN 'current' THEN 0 ELSE 1 END, createdAt, memberAId, memberBId`
  );
  return result.rows.map((row) => rowToRelationship(row as Record<string, unknown>));
}

export async function getRelationshipsForMember(memberId: string): Promise<PartnerRelationship[]> {
  await initDb();
  const result = await db.execute({
    sql: `SELECT * FROM partner_relationships
          WHERE memberAId = ? OR memberBId = ?
          ORDER BY CASE status WHEN 'current' THEN 0 ELSE 1 END, createdAt`,
    args: [memberId, memberId],
  });
  return result.rows.map((row) => rowToRelationship(row as Record<string, unknown>));
}

export async function createRelationship(input: CreateRelationshipInput): Promise<PartnerRelationship> {
  await initDb();

  if (input.memberAId === input.memberBId) {
    throw new Error("Seseorang tidak bisa menjadi pasangan dirinya sendiri.");
  }

  const normalized = normalizePair(input.memberAId, input.memberBId);
  const status = input.status ?? "current";

  const existing = await db.execute({
    sql: `SELECT * FROM partner_relationships WHERE memberAId = ? AND memberBId = ?`,
    args: [normalized.memberAId, normalized.memberBId],
  });

  if (existing.rows.length > 0) {
    const relationship = rowToRelationship(existing.rows[0] as Record<string, unknown>);
    await db.execute({
      sql: `UPDATE partner_relationships SET status = ? WHERE id = ?`,
      args: [status, relationship.id],
    });
    return {
      ...relationship,
      status,
    };
  }

  const id = uuidv4();
  await db.execute({
    sql: `INSERT INTO partner_relationships (id, memberAId, memberBId, status)
          VALUES (?, ?, ?, ?)`,
    args: [id, normalized.memberAId, normalized.memberBId, status],
  });

  const created = await db.execute({
    sql: `SELECT * FROM partner_relationships WHERE id = ?`,
    args: [id],
  });
  return rowToRelationship(created.rows[0] as Record<string, unknown>);
}

export async function deleteRelationship(id: string): Promise<boolean> {
  await initDb();
  const result = await db.execute({
    sql: `DELETE FROM partner_relationships WHERE id = ?`,
    args: [id],
  });
  return (result.rowsAffected ?? 0) > 0;
}
