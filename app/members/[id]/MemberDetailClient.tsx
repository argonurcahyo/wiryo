/**
 * app/members/[id]/MemberDetailClient.tsx
 * Client component for viewing and editing a single member.
 */

"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import type { Member } from "@/lib/members";
import type { MemberPartnerSummary } from "@/lib/relationships";
import MemberForm from "@/components/Member/MemberForm";

interface Props {
  member: Member;
  allMembers: Member[];
  father: Member | null;
  mother: Member | null;
  partners: MemberPartnerSummary[];
  children: Member[];
  startInEditMode: boolean;
}

function partnerLabel(status: MemberPartnerSummary["status"]) {
  if (status === "current") return "Pasangan";
  if (status === "former") return "Mantan pasangan";
  return "Co-parent";
}

export default function MemberDetailClient({
  member,
  allMembers,
  father,
  mother,
  partners,
  children,
  startInEditMode,
}: Props) {
  const router = useRouter();
  const [editing, setEditing] = useState(startInEditMode);
  const [relationshipError, setRelationshipError] = useState<string | null>(null);
  const [relationshipForm, setRelationshipForm] = useState({
    partnerId: "",
    status: "current",
  });

  const partnerOptions = useMemo(
    () => {
      const oppositeGender = member.gender === "L" ? "P" : member.gender === "P" ? "L" : null;
      return allMembers.filter((candidate) => {
        if (candidate.id === member.id) return false;
        // Jika jenis kelamin anggota tidak diketahui, tampilkan semua
        if (!oppositeGender) return true;
        // Tampilkan yang berlawanan jenis atau tidak diketahui
        return !candidate.gender || candidate.gender === oppositeGender;
      });
    },
    [allMembers, member.id, member.gender]
  );

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

  async function handleAddRelationship(e: React.FormEvent) {
    e.preventDefault();
    setRelationshipError(null);

    if (!relationshipForm.partnerId) {
      setRelationshipError("Pilih pasangan terlebih dulu.");
      return;
    }

    const res = await fetch("/api/relationships", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        memberAId: member.id,
        memberBId: relationshipForm.partnerId,
        status: relationshipForm.status,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      setRelationshipError(data.error ?? "Gagal menyimpan relasi.");
      return;
    }

    setRelationshipForm({ partnerId: "", status: "current" });
    router.refresh();
  }

  async function handleDeleteRelationship(relationshipId: string) {
    if (!confirm("Hapus relasi pasangan ini?")) return;
    const res = await fetch(`/api/relationships/${relationshipId}`, {
      method: "DELETE",
    });

    if (!res.ok) {
      const data = await res.json();
      alert(data.error ?? "Gagal menghapus relasi.");
      return;
    }

    router.refresh();
  }

  function handleEditSuccess() {
    setEditing(false);
    router.refresh();
  }

  return (
    <motion.div
      className="space-y-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
    >
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
        <div className="space-y-6">
          <motion.div
            className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-700 dark:bg-zinc-900"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
          >
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

            <dl className="mt-6 space-y-3 text-sm text-zinc-700 dark:text-zinc-300">
              {member.birthDate && (
                <div className="flex gap-3">
                  <dt className="w-24 shrink-0 font-medium text-zinc-500">Tahun Lahir</dt>
                  <dd>{member.birthDate}</dd>
                </div>
              )}

              <div className="flex gap-3">
                <dt className="w-24 shrink-0 font-medium text-zinc-500">Ayah</dt>
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
                <dt className="w-24 shrink-0 font-medium text-zinc-500">Ibu</dt>
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
                  <dt className="w-24 shrink-0 font-medium text-zinc-500">Semua Anak</dt>
                  <dd>
                    <ul className="space-y-1">
                      {children.map((child) => (
                        <li key={child.id}>
                          <Link href={`/members/${child.id}`} className="hover:underline">
                            {child.name}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </dd>
                </div>
              )}
            </dl>
          </motion.div>

          <motion.div
            className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-700 dark:bg-zinc-900"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.08, ease: [0.4, 0, 0.2, 1] }}
          >
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Relasi Pasangan</h2>
                <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                  Satu orang bisa punya beberapa pasangan atau mantan pasangan.
                </p>
              </div>
            </div>

            <form onSubmit={handleAddRelationship} className="mt-5 grid gap-3 md:grid-cols-[1fr_180px_auto]">
              <select
                value={relationshipForm.partnerId}
                onChange={(e) => setRelationshipForm((prev) => ({ ...prev, partnerId: e.target.value }))}
                className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-50"
              >
                <option value="">Pilih pasangan…</option>
                {partnerOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.name}{option.birthDate ? ` (${option.birthDate})` : ""}
                  </option>
                ))}
              </select>

              <select
                value={relationshipForm.status}
                onChange={(e) => setRelationshipForm((prev) => ({ ...prev, status: e.target.value }))}
                className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-50"
              >
                <option value="current">Pasangan aktif</option>
                <option value="former">Mantan pasangan</option>
              </select>

              <button
                type="submit"
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
              >
                Simpan Relasi
              </button>
            </form>

            {relationshipError && (
              <p className="mt-3 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600 dark:bg-red-900/30 dark:text-red-400">
                {relationshipError}
              </p>
            )}

            <div className="mt-6 space-y-4">
              {partners.length === 0 ? (
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  Belum ada pasangan atau mantan pasangan yang tercatat.
                </p>
              ) : (
                partners.map((partner) => (
                  <div
                    key={partner.relationshipId ?? partner.partner.id}
                    className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-700"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                          <Link href={`/members/${partner.partner.id}`} className="hover:underline">
                            {partner.partner.name}
                          </Link>
                        </p>
                        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                          {partnerLabel(partner.status)}
                        </p>
                      </div>

                      {partner.relationshipId ? (
                        <button
                          type="button"
                          onClick={() => handleDeleteRelationship(partner.relationshipId!)}
                          className="rounded-lg bg-red-50 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/60"
                        >
                          Hapus Relasi
                        </button>
                      ) : (
                        <span className="text-xs text-zinc-400">Relasi inferred dari anak</span>
                      )}
                    </div>

                    <div className="mt-3">
                      <p className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                        Anak dari pasangan ini
                      </p>
                      {partner.children.length > 0 ? (
                        <ul className="mt-2 space-y-1 text-sm text-zinc-700 dark:text-zinc-300">
                          {partner.children.map((child) => (
                            <li key={child.id}>
                              <Link href={`/members/${child.id}`} className="hover:underline">
                                {child.name}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">Belum ada anak tercatat.</p>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
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
    </motion.div>
  );
}
