/**
 * lib/tree.ts
 * Converts the flat `members` array from the database into a hierarchical tree
 * structure ready for the recursive React component.
 *
 * Design:
 *  - A member is a "root" if neither fatherId nor motherId exists in the dataset
 *    (i.e. we cannot locate any parent for them).
 *  - Each member node carries its children (people who list this member as a
 *    parent) so the tree can be rendered top-down.
 *  - A single member can appear as both a father and mother link; we deduplicate
 *    by id so each node appears exactly once.
 */

import type { Member } from "./members";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface TreeNode {
  member: Member;
  /** Children: members whose fatherId or motherId equals this node's id */
  children: TreeNode[];
  /** Generation depth (0 = root) */
  depth: number;
}

// ─── Builder ──────────────────────────────────────────────────────────────────

/**
 * Build a forest (array of root TreeNodes) from a flat members array.
 *
 * @param members - All members from the database.
 * @returns An array of root nodes, each with nested children.
 */
export function buildTree(members: Member[]): TreeNode[] {
  const map = new Map<string, Member>(members.map((m) => [m.id, m]));

  // Collect ids that are referenced as a parent
  const parentIds = new Set<string>();
  for (const m of members) {
    if (m.fatherId && map.has(m.fatherId)) parentIds.add(m.fatherId);
    if (m.motherId && map.has(m.motherId)) parentIds.add(m.motherId);
  }

  // Members that have no known parent are roots
  const roots = members.filter(
    (m) =>
      (!m.fatherId || !map.has(m.fatherId)) &&
      (!m.motherId || !map.has(m.motherId))
  );

  /**
   * Recursively build a node for the given member.
   * `visited` prevents infinite loops from accidental cycles surviving
   * the validation layer.
   */
  function buildNode(member: Member, depth: number, visited: Set<string>): TreeNode {
    if (visited.has(member.id)) {
      // Cycle guard – return leaf without children
      return { member, children: [], depth };
    }
    visited.add(member.id);

    // Direct children: members whose fatherId or motherId equals this id
    const childMembers = members.filter(
      (m) => m.fatherId === member.id || m.motherId === member.id
    );

    // Deduplicate (a child could list the same person as both parents edge-case)
    const uniqueChildren = Array.from(
      new Map(childMembers.map((c) => [c.id, c])).values()
    );

    const children = uniqueChildren.map((c) =>
      buildNode(c, depth + 1, new Set(visited))
    );

    // Sort children alphabetically
    children.sort((a, b) => a.member.name.localeCompare(b.member.name));

    return { member, children, depth };
  }

  const forest = roots.map((r) => buildNode(r, 0, new Set()));
  forest.sort((a, b) => a.member.name.localeCompare(b.member.name));
  return forest;
}

/**
 * Flatten a forest back into a plain array (breadth-first).
 * Useful for search / filtering without re-querying the DB.
 */
export function flattenTree(forest: TreeNode[]): Member[] {
  const result: Member[] = [];
  const queue = [...forest];
  while (queue.length > 0) {
    const node = queue.shift()!;
    result.push(node.member);
    queue.push(...node.children);
  }
  return result;
}

/**
 * Find a single node in the forest by member id.
 */
export function findNode(forest: TreeNode[], id: string): TreeNode | null {
  for (const node of forest) {
    if (node.member.id === id) return node;
    const found = findNode(node.children, id);
    if (found) return found;
  }
  return null;
}
