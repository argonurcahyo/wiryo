/**
 * components/Tree/TreeNode.tsx
 * Recursive component that renders a single node and its descendants.
 */

"use client";

import { useState } from "react";
import Link from "next/link";
import type { TreeNode as TNode } from "@/lib/tree";

interface TreeNodeProps {
  node: TNode;
  /** Highlight this member id (e.g. from search) */
  highlightId?: string;
}

export default function TreeNode({ node, highlightId }: TreeNodeProps) {
  const [collapsed, setCollapsed] = useState(false);
  const hasChildren = node.children.length > 0;
  const isHighlighted = node.member.id === highlightId;

  return (
    <li className="relative">
      {/* Connector line for non-root nodes */}
      <div className="flex items-start gap-2">
        {/* Toggle button */}
        {hasChildren && (
          <button
            onClick={() => setCollapsed((c) => !c)}
            aria-label={collapsed ? "Expand" : "Collapse"}
            className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded border border-zinc-300 text-xs text-zinc-500 transition hover:border-emerald-400 hover:text-emerald-600 dark:border-zinc-600 dark:text-zinc-400"
          >
            {collapsed ? "+" : "−"}
          </button>
        )}
        {!hasChildren && <span className="mt-1 h-5 w-5 shrink-0" />}

        {/* Member pill */}
        <Link
          href={`/members/${node.member.id}`}
          className={[
            "inline-flex flex-col rounded-xl border px-3 py-1.5 text-sm transition hover:shadow-md",
            isHighlighted
              ? "border-emerald-500 bg-emerald-50 text-emerald-900 dark:bg-emerald-900/30 dark:text-emerald-300"
              : "border-zinc-200 bg-white text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50",
          ].join(" ")}
        >
          <span className="font-semibold">{node.member.name}</span>
          {node.member.birthDate && (
            <span className="text-xs text-zinc-400 dark:text-zinc-500">
              b. {node.member.birthDate}
            </span>
          )}
        </Link>
      </div>

      {/* Children (recursive) */}
      {hasChildren && !collapsed && (
        <ul
          className="mt-1 ml-7 space-y-2 border-l border-dashed border-zinc-300 pl-4 dark:border-zinc-700"
        >
          {node.children.map((child) => (
            <TreeNode key={child.member.id} node={child} highlightId={highlightId} />
          ))}
        </ul>
      )}
    </li>
  );
}
