"use client";

import Link from "next/link";
import { Pencil, Trash2, Calendar, User, Heart } from "lucide-react";
import type { Member } from "@/lib/members";

interface MemberCardProps {
  member: Member;
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
  // Extract initials for the avatar (e.g. "John Doe" -> "JD")
  const initials = member.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase() || "?";

  return (
    <div className="group relative flex flex-col rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:border-emerald-200 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-emerald-900/50">
      
      {/* Top Header: Avatar, Name & Actions */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400">
            {initials}
          </div>
          <div>
            <Link
              href={`/members/${member.id}`}
              className="text-lg font-bold tracking-tight text-zinc-900 transition-colors hover:text-emerald-600 hover:underline dark:text-zinc-50 dark:hover:text-emerald-400"
            >
              {member.name}
            </Link>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex shrink-0 gap-1 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100">
          <Link
            href={`/members/${member.id}?edit=true`}
            aria-label="Edit member"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-50 text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-50"
          >
            <Pencil className="h-4 w-4" />
          </Link>
          {onDelete && (
            <button
              onClick={() => onDelete(member.id)}
              aria-label="Delete member"
              className="flex h-8 w-8 items-center justify-center rounded-full bg-red-50 text-red-500 transition-colors hover:bg-red-100 hover:text-red-700 dark:bg-red-950/30 dark:text-red-400 dark:hover:bg-red-900/50 dark:hover:text-red-300"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Divider */}
      <hr className="my-4 border-zinc-100 dark:border-zinc-800/60" />

      {/* Details List */}
      <dl className="flex flex-col gap-2.5 text-sm">
        {member.birthDate && (
          <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400">
            <Calendar className="h-4 w-4 shrink-0 text-zinc-400 dark:text-zinc-500" />
            <dt className="sr-only">Born:</dt>
            <dd>{member.birthDate}</dd>
          </div>
        )}

        {/* Parents grouping */}
        {(member.fatherId || member.motherId) && (
          <div className="mt-1 space-y-2">
            {member.fatherId && (
              <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400">
                <User className="h-4 w-4 shrink-0 text-emerald-500/70" />
                <dt className="text-zinc-500">Father:</dt>
                <dd className="font-medium text-zinc-900 dark:text-zinc-300">
                  {fatherName ? (
                    <Link
                      href={`/members/${member.fatherId}`}
                      className="transition hover:text-emerald-600 hover:underline dark:hover:text-emerald-400"
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
              <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400">
                <Heart className="h-4 w-4 shrink-0 text-rose-400/70" />
                <dt className="text-zinc-500">Mother:</dt>
                <dd className="font-medium text-zinc-900 dark:text-zinc-300">
                  {motherName ? (
                    <Link
                      href={`/members/${member.motherId}`}
                      className="transition hover:text-rose-600 hover:underline dark:hover:text-rose-400"
                    >
                      {motherName}
                    </Link>
                  ) : (
                    <span className="italic text-zinc-400">Unknown</span>
                  )}
                </dd>
              </div>
            )}
          </div>
        )}
      </dl>
    </div>
  );
}