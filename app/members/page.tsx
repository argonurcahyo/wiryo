/**
 * app/members/page.tsx
 * Lists all family members with the full tree view and the ability to add
 * new members inline.
 */

import { getAllMembers } from "@/lib/members";
import { getAllRelationships } from "@/lib/relationships";
import TreeView from "@/components/Tree/TreeView";
import MembersClient from "./MembersClient";
import { Network, Users, AlertCircle, GitMerge } from "lucide-react";

export const dynamic = "force-dynamic"; // always fetch fresh data

interface PageProps {
  searchParams: Promise<{ add?: string }>;
}

export default async function MembersPage({ searchParams }: PageProps) {
  const { add } = await searchParams;

  let members: Awaited<ReturnType<typeof getAllMembers>> = [];
  let relationships: Awaited<ReturnType<typeof getAllRelationships>> =[];
  let dbError: string | null = null;

  try {
    [members, relationships] = await Promise.all([
      getAllMembers(),
      getAllRelationships(),
    ]);
  } catch (err) {
    console.error("[MembersPage] getAllMembers failed:", err);
    dbError = err instanceof Error ? err.message : "Database connection failed.";
  }

  return (
    <main className="mx-auto w-full max-w-6xl space-y-12 px-4 py-10 sm:px-6 lg:px-8">
      {/* Page Header */}
      <div className="flex flex-col items-start gap-4 border-b border-zinc-200 pb-8 md:flex-row md:items-center md:justify-between dark:border-zinc-800">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 dark:bg-emerald-900/40">
            <Network className="h-7 w-7 text-emerald-600 dark:text-emerald-500" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">
              Family Tree
            </h1>
            <p className="mt-1.5 flex items-center gap-2 text-sm font-medium text-zinc-500 dark:text-zinc-400">
              <Users className="h-4 w-4" />
              {members.length} member{members.length !== 1 ? "s" : ""} recorded
            </p>
          </div>
        </div>
      </div>

      {/* DB error banner */}
      {dbError && (
        <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 shadow-sm dark:border-red-900/50 dark:bg-red-950/50">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600 dark:text-red-500" />
          <div>
            <h3 className="text-sm font-semibold text-red-800 dark:text-red-300">
              Data Fetching Error
            </h3>
            <p className="mt-1 text-sm text-red-700 dark:text-red-400">
              Could not load data: {dbError}. Check your{" "}
              <code className="rounded bg-red-100 px-1.5 py-0.5 font-mono text-xs dark:bg-red-900/40">
                .env
              </code>{" "}
              file and Turso credentials.
            </p>
          </div>
        </div>
      )}

      {/* Tree visualisation */}
      <section className="space-y-6">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <GitMerge className="h-5 w-5 text-zinc-400 dark:text-zinc-500" />
            <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
              Visual Tree
            </h2>
          </div>
          <div className="h-px flex-1 bg-zinc-200 dark:bg-zinc-800" />
        </div>
        
        {/* Card wrapper for TreeView to maintain consistent UI */}
        <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
          {members.length === 0 ? (
            <div className="flex items-center justify-center p-12 text-sm text-zinc-500 dark:text-zinc-400">
              Add members below to generate your visual tree.
            </div>
          ) : (
            <div className="p-2 sm:p-6">
              <TreeView members={members} relationships={relationships} />
            </div>
          )}
        </div>
      </section>

      {/* Member list + add form */}
      <section className="pt-4">
        {/* Note: The header for this section ("Family Members") is now beautifully handled directly inside MembersClient */}
        <MembersClient initialMembers={members} defaultOpen={add === "true"} />
      </section>
    </main>
  );
}