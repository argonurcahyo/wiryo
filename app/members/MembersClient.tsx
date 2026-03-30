/**
 * app/members/MembersClient.tsx
 * Interactive client component for the members list page:
 *  - Shows member cards with delete
 *  - Toggleable "Add Member" form (auto-opens when defaultOpen=true)
 */

"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { Member } from "@/lib/members";
import MemberCard from "@/components/Member/MemberCard";
import MemberForm from "@/components/Member/MemberForm";

interface MembersClientProps {
  initialMembers: Member[];
  /** Auto-open the form on mount (e.g. from ?add=true URL param) */
  defaultOpen?: boolean;
}

export default function MembersClient({
  initialMembers,
  defaultOpen = false,
}: MembersClientProps) {
  const router = useRouter();
  const [members, setMembers] = useState<Member[]>(initialMembers);
  const [showForm, setShowForm] = useState(defaultOpen);
  const formRef = useRef<HTMLDivElement>(null);

  // Scroll the form into view whenever it opens
  useEffect(() => {
    if (showForm && formRef.current) {
      formRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [showForm]);

  // Build lookup map for parent names
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
          type="button"
          onClick={() => setShowForm((v) => !v)}
          className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 active:scale-95"
        >
          {showForm ? "✕ Cancel" : "+ Add Member"}
        </button>
      </div>

      {/* Add member form — always in DOM, toggled via CSS to avoid hydration issues */}
      <div ref={formRef} className={showForm ? undefined : "hidden"}>
        <MemberForm allMembers={members} onSuccess={handleAddSuccess} />
      </div>

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
