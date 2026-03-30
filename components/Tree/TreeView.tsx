/**
 * components/Tree/TreeView.tsx
 * Renders the full family tree from a flat member list.
 * Builds the tree client-side using lib/tree helpers.
 */

"use client";

import { useState, useMemo } from "react";
import { buildTree } from "@/lib/tree";
import type { Member } from "@/lib/members";
import TreeNode from "./TreeNode";

interface TreeViewProps {
  members: Member[];
}

export default function TreeView({ members }: TreeViewProps) {
  const [search, setSearch] = useState("");

  const forest = useMemo(() => buildTree(members), [members]);

  // Find the highlighted id from search
  const highlightId = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return undefined;
    const found = members.find((m) => m.name.toLowerCase().includes(q));
    return found?.id;
  }, [search, members]);

  if (members.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 py-16 text-center dark:border-zinc-700 dark:bg-zinc-900">
        <p className="text-zinc-500 dark:text-zinc-400">
          No members yet. Add the first person to your family tree!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search */}
      <div>
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search member by name…"
          className="w-full max-w-sm rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-50 dark:placeholder-zinc-500"
        />
        {search && !highlightId && (
          <p className="mt-1 text-xs text-zinc-400">No match found.</p>
        )}
      </div>

      {/* Tree */}
      <div className="overflow-x-auto rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-700 dark:bg-zinc-900">
        <ul className="space-y-3">
          {forest.map((root) => (
            <TreeNode
              key={root.member.id}
              node={root}
              highlightId={highlightId}
            />
          ))}
        </ul>
      </div>

      {/* Stats */}
      <p className="text-right text-xs text-zinc-400 dark:text-zinc-500">
        {members.length} member{members.length !== 1 ? "s" : ""} ·{" "}
        {forest.length} root{forest.length !== 1 ? "s" : ""}
      </p>
    </div>
  );
}
