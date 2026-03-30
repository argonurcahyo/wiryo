/**
 * components/Member/MemberCard.tsx
 * Displays summary information for a single family member.
 */

"use client";

import Link from "next/link";
import type { Member } from "@/lib/members";

interface MemberCardProps {
  member: Member;
  /** Optional: names of parents to display alongside their IDs */
  fatherName?: string | null;
  motherName?: string | null;
  onDelete?: (id: string) => void;
}

export default function MemberCard({
  member,
  fatherName,
  motherName,
  onDelete,
}: MemberCardProps) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm transition hover:shadow-md dark:border-zinc-700 dark:bg-zinc-900">
      {/* Name + actions */}
      <div className="flex items-start justify-between gap-2">
        <Link
          href={`/members/${member.id}`}
          className="text-lg font-semibold text-zinc-900 hover:underline dark:text-zinc-50"
        >
          {member.name}
        </Link>
        <div className="flex shrink-0 gap-2">
          <Link
            href={`/members/${member.id}?edit=true`}
            className="rounded-lg bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
          >
            Edit
          </Link>
          {onDelete && (
            <button
              onClick={() => onDelete(member.id)}
              className="rounded-lg bg-red-50 px-3 py-1 text-xs font-medium text-red-600 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/60"
            >
              Delete
            </button>
          )}
        </div>
      </div>

      {/* Details */}
      <dl className="mt-3 space-y-1 text-sm text-zinc-600 dark:text-zinc-400">
        {member.birthDate && (
          <div className="flex gap-2">
            <dt className="font-medium text-zinc-500">Born:</dt>
            <dd>{member.birthDate}</dd>
          </div>
        )}
        {(member.fatherId || member.motherId) && (
          <>
            {member.fatherId && (
              <div className="flex gap-2">
                <dt className="font-medium text-zinc-500">Father:</dt>
                <dd>
                  {fatherName ? (
                    <Link
                      href={`/members/${member.fatherId}`}
                      className="hover:underline"
                    >
                      {fatherName}
                    </Link>
                  ) : (
                    <span className="italic text-zinc-400">Unknown</span>
                  )}
                </dd>
              </div>
            )}
            {member.motherId && (
              <div className="flex gap-2">
                <dt className="font-medium text-zinc-500">Mother:</dt>
                <dd>
                  {motherName ? (
                    <Link
                      href={`/members/${member.motherId}`}
                      className="hover:underline"
                    >
                      {motherName}
                    </Link>
                  ) : (
                    <span className="italic text-zinc-400">Unknown</span>
                  )}
                </dd>
              </div>
            )}
          </>
        )}
      </dl>
    </div>
  );
}
