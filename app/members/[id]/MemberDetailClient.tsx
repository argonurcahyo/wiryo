/**
 * app/members/[id]/MemberDetailClient.tsx
 * Client component for viewing and editing a single member.
 */

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { Member } from "@/lib/members";
import MemberForm from "@/components/Member/MemberForm";

interface Props {
  member: Member;
  allMembers: Member[];
  father: Member | null;
  mother: Member | null;
  children: Member[];
  startInEditMode: boolean;
}

export default function MemberDetailClient({
  member,
  allMembers,
  father,
  mother,
  children,
  startInEditMode,
}: Props) {
  const router = useRouter();
  const [editing, setEditing] = useState(startInEditMode);

  async function handleDelete() {
    if (!confirm(`Delete "${member.name}"? Their children will be unlinked.`)) return;
    const res = await fetch(`/api/members/${member.id}`, { method: "DELETE" });
    if (res.ok) {
      router.push("/members");
      router.refresh();
    } else {
      const { error } = await res.json();
      alert(error ?? "Failed to delete.");
    }
  }

  function handleEditSuccess() {
    setEditing(false);
    router.refresh();
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="text-sm text-zinc-500 dark:text-zinc-400">
        <Link href="/" className="hover:underline">Home</Link>
        {" / "}
        <Link href="/members" className="hover:underline">Members</Link>
        {" / "}
        <span className="text-zinc-900 dark:text-zinc-50">{member.name}</span>
      </nav>

      {editing ? (
        <MemberForm
          member={member}
          allMembers={allMembers}
          onSuccess={handleEditSuccess}
        />
      ) : (
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
          {/* Header */}
          <div className="flex items-start justify-between gap-4">
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
              {member.name}
            </h1>
            <div className="flex gap-2">
              <button
                onClick={() => setEditing(true)}
                className="rounded-lg bg-zinc-100 px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
              >
                Edit
              </button>
              <button
                onClick={handleDelete}
                className="rounded-lg bg-red-50 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/60"
              >
                Delete
              </button>
            </div>
          </div>

          {/* Details */}
          <dl className="mt-6 space-y-3 text-sm text-zinc-700 dark:text-zinc-300">
            {member.birthDate && (
              <div className="flex gap-3">
                <dt className="w-20 shrink-0 font-medium text-zinc-500">Born</dt>
                <dd>{member.birthDate}</dd>
              </div>
            )}

            <div className="flex gap-3">
              <dt className="w-20 shrink-0 font-medium text-zinc-500">Father</dt>
              <dd>
                {father ? (
                  <Link href={`/members/${father.id}`} className="hover:underline">
                    {father.name}
                  </Link>
                ) : (
                  <span className="italic text-zinc-400">Unknown</span>
                )}
              </dd>
            </div>

            <div className="flex gap-3">
              <dt className="w-20 shrink-0 font-medium text-zinc-500">Mother</dt>
              <dd>
                {mother ? (
                  <Link href={`/members/${mother.id}`} className="hover:underline">
                    {mother.name}
                  </Link>
                ) : (
                  <span className="italic text-zinc-400">Unknown</span>
                )}
              </dd>
            </div>

            {children.length > 0 && (
              <div className="flex gap-3">
                <dt className="w-20 shrink-0 font-medium text-zinc-500">
                  Children
                </dt>
                <dd>
                  <ul className="space-y-1">
                    {children.map((c) => (
                      <li key={c.id}>
                        <Link
                          href={`/members/${c.id}`}
                          className="hover:underline"
                        >
                          {c.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </dd>
              </div>
            )}
          </dl>
        </div>
      )}

      <div className="text-center">
        <Link
          href="/members"
          className="text-sm text-zinc-500 hover:underline dark:text-zinc-400"
        >
          ← Back to all members
        </Link>
      </div>
    </div>
  );
}
