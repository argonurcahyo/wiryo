/**
 * components/Member/MemberForm.tsx
 * Add / edit a family member.
 * Works as a client component; submits to the REST API.
 */

"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Member } from "@/lib/members";

interface MemberFormProps {
  /** When provided the form is in "edit" mode */
  member?: Member;
  /** All existing members (for parent selects) */
  allMembers: Member[];
  onSuccess?: () => void;
}

interface FormState {
  name: string;
  fatherId: string;
  motherId: string;
  birthDate: string;
}

export default function MemberForm({
  member,
  allMembers,
  onSuccess,
}: MemberFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState<FormState>({
    name: member?.name ?? "",
    fatherId: member?.fatherId ?? "",
    motherId: member?.motherId ?? "",
    birthDate: member?.birthDate ?? "",
  });

  // Exclude self from parent options when editing
  const parentOptions = allMembers.filter((m) => m.id !== member?.id);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const payload = {
      name: form.name.trim(),
      fatherId: form.fatherId || null,
      motherId: form.motherId || null,
      birthDate: form.birthDate || null,
    };

    const isEdit = Boolean(member);
    const url = isEdit ? `/api/members/${member!.id}` : "/api/members";
    const method = isEdit ? "PUT" : "POST";

    startTransition(async () => {
      try {
        const res = await fetch(url, {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const data = await res.json();
        if (!res.ok) {
          setError(data.error ?? "Something went wrong.");
          return;
        }

        if (onSuccess) {
          onSuccess();
        } else {
          router.push("/members");
          router.refresh();
        }
      } catch {
        setError("Network error. Please try again.");
      }
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-5 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-700 dark:bg-zinc-900"
    >
      <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
        {member ? "Edit Member" : "Add New Member"}
      </h2>

      {error && (
        <p className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600 dark:bg-red-900/30 dark:text-red-400">
          {error}
        </p>
      )}

      {/* Name */}
      <div>
        <label
          htmlFor="name"
          className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
        >
          Full Name <span className="text-red-500">*</span>
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          value={form.name}
          onChange={handleChange}
          placeholder="e.g. Jane Smith"
          className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-50 dark:placeholder-zinc-500"
        />
      </div>

      {/* Birth Date */}
      <div>
        <label
          htmlFor="birthDate"
          className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
        >
          Birth Date
        </label>
        <input
          id="birthDate"
          name="birthDate"
          type="date"
          value={form.birthDate}
          onChange={handleChange}
          className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-50"
        />
      </div>

      {/* Father */}
      <div>
        <label
          htmlFor="fatherId"
          className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
        >
          Father
        </label>
        <select
          id="fatherId"
          name="fatherId"
          value={form.fatherId}
          onChange={handleChange}
          className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-50"
        >
          <option value="">— None —</option>
          {parentOptions.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>
      </div>

      {/* Mother */}
      <div>
        <label
          htmlFor="motherId"
          className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
        >
          Mother
        </label>
        <select
          id="motherId"
          name="motherId"
          value={form.motherId}
          onChange={handleChange}
          className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-50"
        >
          <option value="">— None —</option>
          {parentOptions.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending
          ? member
            ? "Saving…"
            : "Adding…"
          : member
            ? "Save Changes"
            : "Add Member"}
      </button>
    </form>
  );
}
