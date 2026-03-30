/* eslint-disable react-hooks/set-state-in-effect */
/**
 * components/Tree/TreeView.tsx
 * Renders the full family tree from a flat member list.
 * Builds the tree client-side using lib/tree helpers.
 */

"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { buildTree, getTreeRoots } from "@/lib/tree";
import type { Member } from "@/lib/members";
import type { PartnerRelationship } from "@/lib/relationships";
import TreeNode from "./TreeNode";

interface TreeViewProps {
  members: Member[];
  relationships: PartnerRelationship[];
}

export default function TreeView({ members, relationships }: TreeViewProps) {
  const [search, setSearch] = useState("");
  const [mainRootId, setMainRootId] = useState("all");
  const [fullscreen, setFullscreen] = useState(false);
  const restoredRef = useRef(false);

  const rootOptions = useMemo(() => getTreeRoots(members, relationships), [members, relationships]);

  useEffect(() => {
    if (restoredRef.current) return;
    restoredRef.current = true;
    const stored = localStorage.getItem("wiryo-main-root");
    if (!stored) return;
    if (stored === "all" || rootOptions.some((r) => r.id === stored)) {
      setMainRootId(stored);
    }
  }, [rootOptions]);

  useEffect(() => {
    document.body.style.overflow = fullscreen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [fullscreen]);

  const forest = useMemo(
    () => buildTree(members, relationships, { mainRootId: mainRootId === "all" ? undefined : mainRootId }),
    [members, relationships, mainRootId]
  );

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

  const controlsBar = (
    <div className={fullscreen
      ? "shrink-0 flex flex-col gap-3 border-b border-zinc-200 bg-white/95 px-4 py-3 backdrop-blur-sm dark:border-zinc-700 dark:bg-zinc-950/95 md:flex-row md:items-end md:justify-between"
      : "flex flex-col gap-3 md:flex-row md:items-end md:justify-between"
    }>
      <div>
        <label className="block text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          View Option
        </label>
        <select
          value={mainRootId}
          onChange={(e) => {
            setMainRootId(e.target.value);
            localStorage.setItem("wiryo-main-root", e.target.value);
          }}
          className="mt-1 w-full min-w-0 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-50 md:min-w-70"
        >
          <option value="all">Semua Tree</option>
          {rootOptions.map((root) => (
            <option key={root.id} value={root.id}>
              Main Tree: {root.name}{root.birthDate ? ` (${root.birthDate})` : ""}
            </option>
          ))}
        </select>
        {!fullscreen && (
          <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-500">
            Pilih root utama untuk menampilkan satu tree saja.
          </p>
        )}
      </div>

      <div className="flex items-end gap-2">
        <div>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama…"
            className="w-full max-w-sm rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-50 dark:placeholder-zinc-500"
          />
          {search && !highlightId && (
            <p className="mt-1 text-xs text-zinc-400">Tidak ditemukan.</p>
          )}
        </div>

        <button
          type="button"
          onClick={() => setFullscreen((v) => !v)}
          title={fullscreen ? "Keluar fullscreen" : "Fullscreen"}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-zinc-300 bg-white text-zinc-500 transition hover:border-emerald-400 hover:text-emerald-600 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
        >
          {fullscreen ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );

  return (
    <div className={fullscreen ? "fixed inset-0 z-50 flex flex-col bg-white dark:bg-zinc-950" : "space-y-4"}>
      {controlsBar}

      <div className={fullscreen
        ? "flex-1 overflow-auto p-6"
        : "overflow-x-auto rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-700 dark:bg-zinc-900"
      }>
        <div className="flex min-w-max flex-col items-center gap-10">
          {forest.map((root) => (
            <TreeNode
              key={root.member.id}
              node={root}
              highlightId={highlightId}
            />
          ))}
        </div>
      </div>

      {!fullscreen && (
        <p className="text-right text-xs text-zinc-400 dark:text-zinc-500">
          {members.length} member{members.length !== 1 ? "s" : ""} ·{" "}
          {forest.length} tree ditampilkan · {rootOptions.length} total root
        </p>
      )}
    </div>
  );
}
