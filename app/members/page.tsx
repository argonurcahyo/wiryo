/**
 * app/members/page.tsx
 * Lists all family members with the full tree view and the ability to add
 * new members inline.
 */

import { getAllMembers } from "@/lib/members";
import TreeView from "@/components/Tree/TreeView";
import MembersClient from "./MembersClient";

export const dynamic = "force-dynamic"; // always fetch fresh data

export default async function MembersPage() {
  const members = await getAllMembers();

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

      {/* Tree visualisation (client component handles search + collapse) */}
      <section>
        <h2 className="mb-4 text-xl font-semibold text-zinc-800 dark:text-zinc-200">
          Tree View
        </h2>
        <TreeView members={members} />
      </section>

      {/* Member list + add form */}
      <section>
        <h2 className="mb-4 text-xl font-semibold text-zinc-800 dark:text-zinc-200">
          All Members
        </h2>
        {/* Client component for interactive list, delete, and inline add form */}
        <MembersClient initialMembers={members} />
      </section>
    </main>
  );
}
