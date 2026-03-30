/**
 * app/members/page.tsx
 * Lists all family members with the full tree view and the ability to add
 * new members inline.
 */

import { getAllMembers } from "@/lib/members";
import { getAllRelationships } from "@/lib/relationships";
import TreeView from "@/components/Tree/TreeView";
import MembersClient from "./MembersClient";

export const dynamic = "force-dynamic"; // always fetch fresh data

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
    console.error("[MembersPage] getAllMembers failed:", err);
    dbError = err instanceof Error ? err.message : "Database connection failed.";
  }

  return (
    <main className="mx-auto w-full max-w-5xl space-y-10 px-4 py-10">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Family Tree
          </h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            {members.length} member{members.length !== 1 ? "s" : ""} recorded
          </p>
        </div>
      </div>

      {/* DB error banner */}
      {dbError && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
          ⚠️ Could not load data: {dbError}. Check your{" "}
          <code className="font-mono">.env</code> file and Turso credentials.
        </div>
      )}

      {/* Tree visualisation */}
      <section>
        <h2 className="mb-4 text-xl font-semibold text-zinc-800 dark:text-zinc-200">
          Tree View
        </h2>
        <TreeView members={members} relationships={relationships} />
      </section>

      {/* Member list + add form */}
      <section>
        <h2 className="mb-4 text-xl font-semibold text-zinc-800 dark:text-zinc-200">
          All Members
        </h2>
        {/* defaultOpen=true when coming from the home-page "Add First Member" link (?add=true) */}
        <MembersClient initialMembers={members} defaultOpen={add === "true"} />
      </section>
    </main>
  );
}
