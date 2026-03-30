/**
 * lib/relationship-utils.ts
 * Pure types and utility functions for partner relationships.
 * Contains NO database imports — safe to import in both client and server code.
 */

import type { Member } from "./members";

export type RelationshipStatus = "current" | "former";

export interface PartnerRelationship {
  id: string;
  memberAId: string;
  memberBId: string;
  status: RelationshipStatus;
  createdAt?: string;
}

export interface CreateRelationshipInput {
  memberAId: string;
  memberBId: string;
  status?: RelationshipStatus;
}

export interface MemberPartnerSummary {
  relationshipId?: string;
  partner: Member;
  status: RelationshipStatus | "inferred";
  children: Member[];
}

export function getPartnerId(
  relationship: PartnerRelationship,
  memberId: string
): string | null {
  if (relationship.memberAId === memberId) return relationship.memberBId;
  if (relationship.memberBId === memberId) return relationship.memberAId;
  return null;
}

export function getChildrenForPair(
  members: Member[],
  memberId: string,
  partnerId?: string | null
): Member[] {
  const children = members.filter((candidate) => {
    const parentIds = new Set(
      [candidate.fatherId, candidate.motherId].filter(Boolean)
    );
    if (!parentIds.has(memberId)) return false;
    if (!partnerId) return parentIds.size <= 1;
    return parentIds.has(partnerId);
  });

  return children.sort((a, b) => {
    const ay = parseInt(a.birthDate ?? "", 10);
    const by = parseInt(b.birthDate ?? "", 10);
    if (!isNaN(ay) && !isNaN(by)) return ay - by;
    if (!isNaN(ay)) return -1;
    if (!isNaN(by)) return 1;
    return a.name.localeCompare(b.name);
  });
}

export function getMemberPartnerSummaries(
  member: Member,
  members: Member[],
  relationships: PartnerRelationship[]
): MemberPartnerSummary[] {
  const memberMap = new Map(members.map((item) => [item.id, item]));
  const summaryMap = new Map<string, MemberPartnerSummary>();

  for (const relationship of relationships) {
    const partnerId = getPartnerId(relationship, member.id);
    if (!partnerId) continue;
    const partner = memberMap.get(partnerId);
    if (!partner) continue;

    summaryMap.set(partner.id, {
      relationshipId: relationship.id,
      partner,
      status: relationship.status,
      children: getChildrenForPair(members, member.id, partner.id),
    });
  }

  for (const child of members) {
    const partnerId =
      child.fatherId === member.id
        ? child.motherId
        : child.motherId === member.id
          ? child.fatherId
          : null;
    if (!partnerId) continue;
    const partner = memberMap.get(partnerId);
    if (!partner) continue;
    if (summaryMap.has(partner.id)) continue;

    summaryMap.set(partner.id, {
      partner,
      status: "inferred",
      children: getChildrenForPair(members, member.id, partner.id),
    });
  }

  return Array.from(summaryMap.values()).sort((a, b) => {
    const statusRank = (status: MemberPartnerSummary["status"]) => {
      if (status === "current") return 0;
      if (status === "former") return 1;
      return 2;
    };
    const rankDiff = statusRank(a.status) - statusRank(b.status);
    if (rankDiff !== 0) return rankDiff;

    const ay = parseInt(a.partner.birthDate ?? "", 10);
    const by = parseInt(b.partner.birthDate ?? "", 10);
    if (!isNaN(ay) && !isNaN(by)) return ay - by;
    if (!isNaN(ay)) return -1;
    if (!isNaN(by)) return 1;
    return a.partner.name.localeCompare(b.partner.name);
  });
}
