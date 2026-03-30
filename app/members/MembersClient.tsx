/**
 * app/members/MembersClient.tsx
 * Interactive client component for the members list page:
 *  - Shows member cards with delete
 *  - Toggleable "Add Member" form
 */

"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import type { Member } from "@/lib/members";
import MemberCard from "@/components/Member/MemberCard";
import MemberForm from "@/components/Member/MemberForm";

interface MembersClientProps {
  initialMembers: Member[];
}

export default function MembersClient({ initialMembers }: MembersClientProps) {
  const router = useRouter();
  const [members, setMembers] = useState<Member[]>(initialMembers);
  const [showForm, setShowForm] = useState(false);

  // Build lookup maps for parent names
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
    // Re-fetch the latest list
    const res = await fetch("/api/members");
    if (res.ok) {
      const { members: fresh } = await res.json();
      setMembers(fresh);
    }
    setShowForm(false);
    router.refresh();
  }, [router]);

  return (
    <div className="space-y-6">
      {/* Toggle add form */}
      <div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
        >
          {showForm ? "Cancel" : "+ Add Member"}
        </button>
      </div>

      {showForm && (
        <MemberForm allMembers={members} onSuccess={handleAddSuccess} />
      )}

      {/* Member cards */}
      {members.length === 0 ? (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          No members yet. Add the first one!
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
