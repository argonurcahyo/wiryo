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
  birthDate: string; // stores year as string e.g. "1985"
  gender: string;   // "L" | "P" | ""
}

const EMPTY_FORM: FormState = { name: "", fatherId: "", motherId: "", birthDate: "", gender: "" };

export default function MemberForm({
  member,
  allMembers,
  onSuccess,
}: MemberFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState<FormState>(
    member
      ? { name: member.name, fatherId: member.fatherId ?? "", motherId: member.motherId ?? "", birthDate: member.birthDate ?? "", gender: member.gender ?? "" }
      : EMPTY_FORM
  );

  // Exclude self from parent options when editing
  const parentOptions = allMembers.filter((m) => m.id !== member?.id);
  // Filter berdasarkan jenis kelamin: ayah hanya L atau tidak diketahui, ibu hanya P atau tidak diketahui
  const fatherOptions = parentOptions.filter((m) => !m.gender || m.gender === "L");
  const motherOptions = parentOptions.filter((m) => !m.gender || m.gender === "P");

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
      gender: form.gender || null,
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

        // Reset form fields if adding a new member
        if (!isEdit) {
          setForm(EMPTY_FORM);
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

      {/* Birth Year */}
      <div>
        <label
          htmlFor="birthDate"
          className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
        >
          Tahun Lahir
        </label>
        <input
          id="birthDate"
          name="birthDate"
          type="number"
          min="1800"
          max={new Date().getFullYear()}
          value={form.birthDate}
          onChange={handleChange}
          placeholder="e.g. 1985"
          className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-50 dark:placeholder-zinc-500"
        />
      </div>

      {/* Gender */}
      <div>
        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Jenis Kelamin
        </label>
        <div className="mt-2 flex flex-wrap gap-5">
          {(["L", "P", ""] as const).map((val) => (
            <label key={val} className="flex cursor-pointer items-center gap-1.5 text-sm text-zinc-700 dark:text-zinc-300">
              <input
                type="radio"
                name="gender"
                value={val}
                checked={form.gender === val}
                onChange={handleChange}
                className="accent-emerald-600"
              />
              {val === "L" ? "Laki-laki" : val === "P" ? "Perempuan" : "Tidak diketahui"}
            </label>
          ))}
        </div>
      </div>

      {/* Father */}
      <div>
        <label
          htmlFor="fatherId"
          className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
        >
          Ayah
        </label>
        <select
          id="fatherId"
          name="fatherId"
          value={form.fatherId}
          onChange={handleChange}
          className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-50"
        >
          <option value="">— Tidak Ada —</option>
          {fatherOptions.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}{m.birthDate ? ` (${m.birthDate})` : ""}
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
          Ibu
        </label>
        <select
          id="motherId"
          name="motherId"
          value={form.motherId}
          onChange={handleChange}
          className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-50"
        >
          <option value="">— Tidak Ada —</option>
          {motherOptions.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}{m.birthDate ? ` (${m.birthDate})` : ""}
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
