/**
 * app/members/page.tsx
 * Manage family members: add, edit, delete.
 * Also shows the visual family tree below the member list.
 */

import { getAllMembers } from "@/lib/members";
import { getAllRelationships } from "@/lib/relationships";
import TreeView from "@/components/Tree/TreeView";
import MembersClient from "./MembersClient";
import Link from "next/link";
import { Settings2, AlertCircle, GitMerge, ArrowLeft } from "lucide-react";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{ add?: string }>;
}

export default async function MembersPage({ searchParams }: PageProps) {
  const { add } = await searchParams;

  let members: Awaited<ReturnType<typeof getAllMembers>> = [];
  let relationships: Awaited<ReturnType<typeof getAllRelationships>> = [];
  let dbError: string | null = null;

  try {
    [members, relationships] = await Promise.all([
      getAllMembers(),
      getAllRelationships(),
    ]);
  } catch (err) {
    console.error("[MembersPage] failed:", err);
    dbError = err instanceof Error ? err.message : "Database connection failed.";
  }

  return (
    <main className="mx-auto w-full max-w-6xl space-y-10 px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex flex-col items-start gap-4 border-b border-zinc-200 pb-6 md:flex-row md:items-center md:justify-between dark:border-zinc-800">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-zinc-100 dark:bg-zinc-800">
            <Settings2 className="h-7 w-7 text-zinc-600 dark:text-zinc-400" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">
              Manage Members
            </h1>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              Add, edit, or delete family members and relationships.
            </p>
          </div>
        </div>
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-600 shadow-sm transition hover:bg-zinc-50 hover:text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-50"
        >
          <ArrowLeft className="h-4 w-4" />
          View Tree
        </Link>
      </div>

      {/* DB error banner */}
      {dbError && (
        <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 shadow-sm dark:border-red-900/50 dark:bg-red-950/50">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600 dark:text-red-500" />
          <div>
            <h3 className="text-sm font-semibold text-red-800 dark:text-red-300">Data Fetching Error</h3>
            <p className="mt-1 text-sm text-red-700 dark:text-red-400">
              Could not load data: {dbError}. Check your{" "}
              <code className="rounded bg-red-100 px-1.5 py-0.5 font-mono text-xs dark:bg-red-900/40">.env</code>{" "}
              file and Turso credentials.
            </p>
          </div>
        </div>
      )}

      {/* Member management */}
      <MembersClient initialMembers={members} defaultOpen={add === "true"} />

      {/* Visual tree (for reference while managing) */}
      <section className="space-y-4 border-t border-zinc-200 pt-10 dark:border-zinc-800">
        <div className="flex items-center gap-3">
          <GitMerge className="h-5 w-5 text-zinc-400 dark:text-zinc-500" />
          <h2 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Visual Tree
          </h2>
          <div className="h-px flex-1 bg-zinc-200 dark:bg-zinc-800" />
        </div>
        <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
          <div className="p-2 sm:p-6">
            <TreeView members={members} relationships={relationships} />
          </div>
        </div>
      </section>
    </main>
  );
}

