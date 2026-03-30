"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { TreeNode as TNode, TreePartnerGroup } from "@/lib/tree";

interface TreeNodeProps {
  node: TNode;
  highlightId?: string;
}

function MemberCard({
  member,
  isHighlighted,
}: {
  member: { id: string; name: string; birthDate?: string | null; gender?: "L" | "P" | null };
  isHighlighted: boolean;
}) {
  const colorClass = isHighlighted
    ? "border-emerald-500 bg-emerald-50 text-emerald-900 dark:bg-emerald-900/30 dark:text-emerald-300"
    : member.gender === "L"
      ? "border-blue-200 bg-blue-50 text-blue-900 dark:border-blue-800/50 dark:bg-blue-950/40 dark:text-blue-100"
      : member.gender === "P"
        ? "border-rose-200 bg-rose-50 text-rose-900 dark:border-rose-800/50 dark:bg-rose-950/40 dark:text-rose-100"
        : "border-zinc-200 bg-white text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50";

  return (
    <Link
      href={`/members/${member.id}`}
      className={`inline-flex w-40 flex-col items-center rounded-xl border px-4 py-2.5 text-center text-sm shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${colorClass}`}
    >
      <span className="font-semibold leading-tight">{member.name}</span>
      {member.birthDate && (
        <span className="mt-0.5 text-xs opacity-60">{member.birthDate}</span>
      )}
    </Link>
  );
}

/** Garis antara dua pasangan. Mantan: garis + lingkaran silang di tengah. */
function PartnerConnector({ status }: { status: TreePartnerGroup["status"] }) {
  if (status === "former") {
    return (
      <div className="flex items-center">
        <div className="h-px w-5 bg-zinc-300 dark:bg-zinc-600" />
        <div className="mx-1 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-zinc-300 text-[9px] leading-none text-zinc-400 dark:border-zinc-600 dark:text-zinc-500">
          ✕
        </div>
        <div className="h-px w-5 bg-zinc-300 dark:bg-zinc-600" />
      </div>
    );
  }
  return <div className="h-px w-10 bg-zinc-300 dark:bg-zinc-600" />;
}

function FamilyBranch({
  node,
  group,
  highlightId,
  collapsed,
  onToggle,
}: {
  node: TNode;
  group: TreePartnerGroup;
  highlightId?: string;
  collapsed: boolean;
  onToggle?: () => void;
}) {
  const hasChildren = group.children.length > 0;

  return (
    <div className="flex flex-col items-center">
      {/* Baris pasangan. */}
      <div className="flex items-center">
        <MemberCard member={node.member} isHighlighted={node.member.id === highlightId} />
        {group.partner && (
          <div className="flex items-center">
            <PartnerConnector status={group.status} />
            <MemberCard member={group.partner} isHighlighted={group.partner.id === highlightId} />
          </div>
        )}
      </div>

      {/* Garis vertikal → tombol +/- → anak-anak */}
      {hasChildren && (
        <div className="flex flex-col items-center">
          <div className="h-4 w-px bg-zinc-300 dark:bg-zinc-600" />
          {onToggle ? (
            <button
              type="button"
              onClick={onToggle}
              title={collapsed ? "Tampilkan keturunan" : "Sembunyikan keturunan"}
              className="flex h-5 w-5 items-center justify-center rounded-full border border-zinc-300 bg-white text-xs leading-none text-zinc-500 transition hover:border-emerald-400 hover:text-emerald-600 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-400"
            >
              {collapsed ? "+" : "−"}
            </button>
          ) : (
            /* Placeholder agar garis lurus ketika branch lain punya toggle */
            <div className="h-5 w-px bg-zinc-300 dark:bg-zinc-600" />
          )}
          {!collapsed && (
            <>
              <div className="h-4 w-px bg-zinc-300 dark:bg-zinc-600" />
              <div className="flex justify-center gap-0">
                {group.children.map((child, idx) => {
                  const isFirst = idx === 0;
                  const isLast = idx === group.children.length - 1;
                  const isOnly = group.children.length === 1;
                  const firstPartnerGroup = child.partnerGroups.find((g) => Boolean(g.partner));
                  // Anchor koneksi parent->child harus tepat di tengah kartu anak kandung.
                  // Jika anak punya pasangan, pusat TreeNode anak ada di tengah garis pasangan,
                  // jadi anchor digeser ke kiri:
                  // - current/inferred: connector 2.5rem => shift 6.25rem
                  // - former: connector 4rem (ada silang) => shift 7rem
                  const childAnchorShiftRem = firstPartnerGroup
                    ? firstPartnerGroup.status === "former"
                      ? 7
                      : 6.25
                    : 0;
                  const childAnchorX = childAnchorShiftRem > 0
                    ? `calc(50% - ${childAnchorShiftRem}rem)`
                    : "50%";
                  return (
                    <div
                      key={`${group.relationshipId ?? group.partner?.id ?? "single"}-${child.member.id}`}
                      className="flex flex-col items-center"
                    >
                      <div className="relative flex h-4 w-full items-end justify-center">
                        {!isOnly && !isFirst && (
                          <div
                            className="absolute top-0 left-0 h-px bg-zinc-300 dark:bg-zinc-600"
                            style={{ right: `calc(100% - ${childAnchorX})` }}
                          />
                        )}
                        <div
                          className="absolute top-0 h-4 w-px -translate-x-1/2 bg-zinc-300 dark:bg-zinc-600"
                          style={{ left: childAnchorX }}
                        />
                        {!isOnly && !isLast && (
                          <div
                            className="absolute top-0 right-0 h-px bg-zinc-300 dark:bg-zinc-600"
                            style={{ left: childAnchorX }}
                          />
                        )}
                      </div>
                      <div className="px-3">
                        <TreeNode node={child} highlightId={highlightId} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default function TreeNode({ node, highlightId }: TreeNodeProps) {
  const [collapsed, setCollapsed] = useState(false);

  const visibleGroups = useMemo(() => {
    const groups = node.partnerGroups.filter(
      (group) => group.partner || group.children.length > 0,
    );
    return groups.length > 0
      ? groups
      : [{ partner: null, status: "single-parent" as const, children: [] }];
  }, [node.partnerGroups]);

  // Tombol toggle hanya muncul di branch pertama yang punya anak
  const firstWithChildrenIdx = visibleGroups.findIndex((g) => g.children.length > 0);

  return (
    <div className="flex flex-col items-center gap-5">
      {visibleGroups.map((group, index) => (
        <FamilyBranch
          key={`${node.member.id}-${group.relationshipId ?? group.partner?.id ?? `single-${index}`}`}
          node={node}
          group={group}
          highlightId={highlightId}
          collapsed={collapsed}
          onToggle={
            index === firstWithChildrenIdx
              ? () => setCollapsed((v) => !v)
              : undefined
          }
        />
      ))}
    </div>
  );
}
