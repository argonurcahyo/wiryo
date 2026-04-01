"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { UserPlus, X, Users } from "lucide-react";
import type { Member } from "@/lib/members";
import MemberCard from "@/components/Member/MemberCard";
import MemberForm from "@/components/Member/MemberForm";

interface MembersClientProps {
  initialMembers: Member[];
  defaultOpen?: boolean;
}

export default function MembersClient({
  initialMembers,
  defaultOpen = false,
}: MembersClientProps) {
  const router = useRouter();
  const[members, setMembers] = useState<Member[]>(initialMembers);
  const [showForm, setShowForm] = useState(defaultOpen);
  const formRef = useRef<HTMLDivElement>(null);

  // Scroll the form into view whenever it opens
  useEffect(() => {
    if (showForm && formRef.current) {
      formRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [showForm]);

  const memberMap = new Map(members.map((m) => [m.id, m]));

  async function handleDelete(id: string) {
    if (!confirm("Delete this member? Their children will be unlinked.")) return;
    const res = await fetch(`/api/members/${id}`, { method: "DELETE" });
    if (res.ok) {
      setMembers((prev) => prev.filter((m) => m.id !== id));
      router.refresh();
    } else {
      const { error } = await res.json();
      alert(error ?? "Failed to delete.");
    }
  }

  const handleAddSuccess = useCallback(async () => {
    const res = await fetch("/api/members");
    if (res.ok) {
      const { members: fresh } = await res.json();
      setMembers(fresh);
    }
    setShowForm(false);
    router.refresh();
  }, [router]);

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Family Members
          </h2>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Manage your family tree and relationships.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          className={`inline-flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold shadow-sm transition-all active:scale-95 focus-visible:ring-2 focus-visible:ring-offset-2 ${
            showForm
              ? "bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
              : "bg-emerald-600 text-white hover:bg-emerald-700 hover:shadow focus-visible:ring-emerald-600 dark:bg-emerald-500 dark:hover:bg-emerald-600"
          }`}
        >
          {showForm ? (
            <>
              <X className="h-4 w-4" /> Cancel
            </>
          ) : (
            <>
              <UserPlus className="h-4 w-4" /> Add Member
            </>
          )}
        </button>
      </div>

      {/* Form Container with visual grouping */}
      <div
        ref={formRef}
        className={
          showForm
            ? "animate-in fade-in slide-in-from-top-4 duration-300"
            : "hidden"
        }
      >
        <div className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-4 sm:p-6 dark:border-emerald-900/30 dark:bg-emerald-900/10">
          <MemberForm allMembers={members} onSuccess={handleAddSuccess} />
        </div>
      </div>

      {/* Content */}
      {members.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-zinc-200 py-16 text-center dark:border-zinc-800">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800/50">
            <Users className="h-7 w-7 text-zinc-400 dark:text-zinc-500" />
          </div>
          <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
            No family members yet
          </h3>
          <p className="mt-1 max-w-sm text-sm text-zinc-500 dark:text-zinc-400">
            Get started by adding the first member of your family tree to keep track of everyone.
          </p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {members.map((m) => (
            <MemberCard
              key={m.id}
              member={m}
              fatherName={m.fatherId ? memberMap.get(m.fatherId)?.name : null}
              motherName={m.motherId ? memberMap.get(m.motherId)?.name : null}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}