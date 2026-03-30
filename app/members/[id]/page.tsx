/**
 * app/members/[id]/page.tsx
 * View / edit a single family member.
 * params is a Promise in Next.js 16+, must be awaited.
 */

import { notFound } from "next/navigation";
import { getMemberById, getAllMembers } from "@/lib/members";
import MemberDetailClient from "./MemberDetailClient";

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ edit?: string }>;
}

export default async function MemberDetailPage({
  params,
  searchParams,
}: PageProps) {
  const { id } = await params;
  const { edit } = await searchParams;

  const [member, allMembers] = await Promise.all([
    getMemberById(id),
    getAllMembers(),
  ]);

  if (!member) notFound();

  const memberMap = new Map(allMembers.map((m) => [m.id, m]));
  const father = member.fatherId ? memberMap.get(member.fatherId) : null;
  const mother = member.motherId ? memberMap.get(member.motherId) : null;
  const children = allMembers.filter(
    (m) => m.fatherId === id || m.motherId === id
  );

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-10">
      <MemberDetailClient
        member={member}
        allMembers={allMembers}
        father={father ?? null}
        mother={mother ?? null}
        children={children}
        startInEditMode={edit === "true"}
      />
    </main>
  );
}
