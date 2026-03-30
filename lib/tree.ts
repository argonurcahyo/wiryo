import type { Member } from "./members";
import {
  getChildrenForPair,
  getPartnerId,
  type PartnerRelationship,
  type RelationshipStatus,
} from "./relationship-utils";

export interface TreePartnerGroup {
  partner: Member | null;
  status: RelationshipStatus | "single-parent" | "inferred";
  relationshipId?: string;
  children: TreeNode[];
}

export interface TreeNode {
  member: Member;
  partnerGroups: TreePartnerGroup[];
  depth: number;
}

export interface BuildTreeOptions {
  mainRootId?: string;
}

function sortMembers(a: Member, b: Member): number {
  const ya = parseInt(a.birthDate ?? "", 10);
  const yb = parseInt(b.birthDate ?? "", 10);
  if (!isNaN(ya) && !isNaN(yb)) return ya - yb;
  if (!isNaN(ya)) return -1;
  if (!isNaN(yb)) return 1;
  return a.name.localeCompare(b.name);
}

function getInferredPartnerPairs(members: Member[]): Array<[string, string]> {
  const pairSet = new Set<string>();

  for (const member of members) {
    if (!member.fatherId || !member.motherId) continue;
    const pair = member.fatherId < member.motherId
      ? `${member.fatherId}:${member.motherId}`
      : `${member.motherId}:${member.fatherId}`;
    pairSet.add(pair);
  }

  return Array.from(pairSet).map((pair) => {
    const [left, right] = pair.split(":");
    return [left, right] as [string, string];
  });
}

export function getTreeRoots(
  members: Member[],
  relationships: PartnerRelationship[]
): Member[] {
  const memberMap = new Map(members.map((member) => [member.id, member]));
  const rootCandidates = members.filter(
    (member) =>
      (!member.fatherId || !memberMap.has(member.fatherId)) &&
      (!member.motherId || !memberMap.has(member.motherId))
  );

  const rootIds = new Set(rootCandidates.map((member) => member.id));
  const adjacency = new Map<string, Set<string>>();

  function connect(left: string, right: string) {
    if (!rootIds.has(left) || !rootIds.has(right)) return;
    if (!adjacency.has(left)) adjacency.set(left, new Set());
    if (!adjacency.has(right)) adjacency.set(right, new Set());
    adjacency.get(left)!.add(right);
    adjacency.get(right)!.add(left);
  }

  for (const relationship of relationships) {
    connect(relationship.memberAId, relationship.memberBId);
  }

  for (const [left, right] of getInferredPartnerPairs(members)) {
    connect(left, right);
  }

  const visited = new Set<string>();
  const roots: Member[] = [];

  for (const candidate of rootCandidates) {
    if (visited.has(candidate.id)) continue;

    const stack = [candidate.id];
    const component: Member[] = [];
    visited.add(candidate.id);

    while (stack.length > 0) {
      const currentId = stack.pop()!;
      const current = memberMap.get(currentId);
      if (current) component.push(current);

      for (const nextId of adjacency.get(currentId) ?? []) {
        if (visited.has(nextId)) continue;
        visited.add(nextId);
        stack.push(nextId);
      }
    }

    roots.push(component.sort(sortMembers)[0]);
  }

  return roots.sort(sortMembers);
}

export function buildTree(
  members: Member[],
  relationships: PartnerRelationship[],
  options: BuildTreeOptions = {}
): TreeNode[] {
  const memberMap = new Map(members.map((member) => [member.id, member]));
  const roots = getTreeRoots(members, relationships);
  const selectedRoots = options.mainRootId
    ? roots.filter((root) => root.id === options.mainRootId)
    : roots;

  function buildNode(member: Member, depth: number, visited: Set<string>): TreeNode {
    if (visited.has(member.id)) {
      return { member, partnerGroups: [], depth };
    }

    const nextVisited = new Set(visited);
    nextVisited.add(member.id);

    const explicitGroups = new Map<string, { partner: Member; status: RelationshipStatus | "inferred"; relationshipId?: string }>();

    for (const relationship of relationships) {
      const partnerId = getPartnerId(relationship, member.id);
      if (!partnerId) continue;
      const partner = memberMap.get(partnerId);
      if (!partner) continue;
      explicitGroups.set(partner.id, {
        partner,
        status: relationship.status,
        relationshipId: relationship.id,
      });
    }

    for (const child of members) {
      const partnerId = child.fatherId === member.id ? child.motherId : child.motherId === member.id ? child.fatherId : null;
      if (!partnerId) continue;
      if (explicitGroups.has(partnerId)) continue;
      const partner = memberMap.get(partnerId);
      if (!partner) continue;
      explicitGroups.set(partner.id, {
        partner,
        status: "inferred",
      });
    }

    const assignedChildIds = new Set<string>();
    const partnerGroups: TreePartnerGroup[] = [];

    for (const group of Array.from(explicitGroups.values()).sort((a, b) => {
      const rank = (status: TreePartnerGroup["status"]) => {
        if (status === "current") return 0;
        if (status === "former") return 1;
        if (status === "inferred") return 2;
        return 3;
      };
      const diff = rank(a.status) - rank(b.status);
      if (diff !== 0) return diff;
      return sortMembers(a.partner, b.partner);
    })) {
      const childNodes = getChildrenForPair(members, member.id, group.partner.id)
        .filter((child) => {
          if (assignedChildIds.has(child.id)) return false;
          assignedChildIds.add(child.id);
          return true;
        })
        .map((child) => buildNode(child, depth + 1, nextVisited));

      partnerGroups.push({
        partner: group.partner,
        status: group.status,
        relationshipId: group.relationshipId,
        children: childNodes,
      });
    }

    const singleParentChildren = members
      .filter((child) => {
        const isChild = child.fatherId === member.id || child.motherId === member.id;
        return isChild && !assignedChildIds.has(child.id);
      })
      .sort(sortMembers)
      .map((child) => {
        assignedChildIds.add(child.id);
        return buildNode(child, depth + 1, nextVisited);
      });

    if (singleParentChildren.length > 0 || partnerGroups.length === 0) {
      partnerGroups.push({
        partner: null,
        status: "single-parent",
        children: singleParentChildren,
      });
    }

    return { member, partnerGroups, depth };
  }

  return selectedRoots.map((root) => buildNode(root, 0, new Set())).sort((a, b) => sortMembers(a.member, b.member));
}

export function flattenTree(forest: TreeNode[]): Member[] {
  const result: Member[] = [];
  const queue = [...forest];
  while (queue.length > 0) {
    const node = queue.shift()!;
    result.push(node.member);
    for (const group of node.partnerGroups) {
      queue.push(...group.children);
    }
  }
  return result;
}

export function findNode(forest: TreeNode[], id: string): TreeNode | null {
  for (const node of forest) {
    if (node.member.id === id) return node;
    for (const group of node.partnerGroups) {
      const found = findNode(group.children, id);
      if (found) return found;
    }
  }
  return null;
}
