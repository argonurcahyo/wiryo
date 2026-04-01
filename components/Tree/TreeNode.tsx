"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Plus, Minus, X } from "lucide-react";
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
  const baseClasses =
    "relative z-10 inline-flex w-36 flex-col items-center justify-center rounded-xl border px-2 py-2 text-center shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md";

  const colorClass = isHighlighted
    ? "border-emerald-500 bg-emerald-50 text-emerald-900 ring-2 ring-emerald-500/20 dark:bg-emerald-900/40 dark:text-emerald-100 dark:border-emerald-400"
    : member.gender === "L"
      ? "border-blue-200 bg-blue-50 text-blue-900 dark:border-blue-800/60 dark:bg-blue-950/40 dark:text-blue-100"
      : member.gender === "P"
        ? "border-rose-200 bg-rose-50 text-rose-900 dark:border-rose-800/60 dark:bg-rose-950/40 dark:text-rose-100"
        : "border-zinc-200 bg-white text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50";

  return (
    <Link href={`/members/${member.id}`} className={`${baseClasses} ${colorClass}`}>
      <span className="text-xs font-semibold leading-tight tracking-tight">
        {member.name}
      </span>
      {member.birthDate && (
        <span className="mt-0.5 text-[10px] font-medium opacity-80">
          {member.birthDate}
        </span>
      )}
    </Link>
  );
}

/** Garis horizontal antar pasangan. Mantan: ada badge silang (X) di tengah. */
function PartnerConnector({ status }: { status: TreePartnerGroup["status"] }) {
  if (status === "former") {
    return (
      <div className="flex w-6 items-center justify-center">
        <div className="h-px flex-1 bg-zinc-300 dark:bg-zinc-600" />
        <div className="mx-0.5 flex h-3 w-3 shrink-0 items-center justify-center rounded-full border border-zinc-300 bg-white text-zinc-400 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-500">
          <X className="h-2 w-2" strokeWidth={3} />
        </div>
        <div className="h-px flex-1 bg-zinc-300 dark:bg-zinc-600" />
      </div>
    );
  }
  return <div className="h-px w-6 bg-zinc-300 dark:bg-zinc-600" />;
}

/**
 * Toggle button yang terletak di atas garis vertikal.
 * Garis kontinu digambar di belakang tombol (z-0), tombol di z-10,
 * sehingga terlihat seperti "bead on a string" — bukan garis putus.
 */
function ToggleButton({
  collapsed,
  onToggle,
}: {
  collapsed: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="relative flex h-5 w-5 items-center justify-center">
      {/* Garis kontinu di belakang tombol */}
      <div className="absolute inset-x-0 top-0 bottom-0 mx-auto w-px bg-zinc-300 dark:bg-zinc-600" />
      <button
        type="button"
        onClick={onToggle}
        title={collapsed ? "Tampilkan keturunan" : "Sembunyikan keturunan"}
        className="relative z-10 flex h-5 w-5 items-center justify-center rounded-full border border-zinc-300 bg-white text-zinc-500 shadow-sm transition hover:scale-110 hover:border-emerald-400 hover:text-emerald-600 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-400"
      >
        {collapsed ? <Plus className="h-3 w-3" /> : <Minus className="h-3 w-3" />}
      </button>
    </div>
  );
}

/**
 * ═══════════════════════════════════════════════════════════════
 *  KONSTANTA UKURAN  (harus sinkron dengan JSX di bawah)
 *
 *  CARD      = w-36  = 9rem    → half = 4.5rem
 *  CONNECTOR = w-6   = 1.5rem
 *
 *  Anchor vertikal per group (jarak dari kiri blok baris pasangan):
 *
 *  Single (no partner):
 *    anchor = 4.5rem  (center X)
 *
 *  Group KANAN (partner di sebelah kanan X):
 *    offset_x  = lebar semua group kiri + lebar X
 *    anchor    = offset_x + 0 + CONNECTOR/2 + (CONNECTOR/2 + CARD/2)
 *              = offset_x + CARD/2 + CONNECTOR + CARD/2
 *              = offset_x + CARD + CONNECTOR/2 + CONNECTOR/2   ← midpoint garis
 *    disederhanakan:
 *    anchor = left_X + CARD + CONNECTOR/2   (center connector = center couple)
 *    → lebih tepat: midpoint antara right edge X dan left edge partner
 *      = left_X + CARD + CONNECTOR/2
 *    → tapi kita ingin center of couple row  = left_X + (CARD + CONNECTOR + CARD)/2
 *      = left_X + CARD/2 + CONNECTOR/2 + CARD/2 - wait, that's midpoint of X...
 *
 *  SIMPLIFIKASI: setiap ChildSection tahu `anchorFromLeft` — dihitung di TreeNode.
 * ═══════════════════════════════════════════════════════════════
 */
const CARD_W   = 9;    // rem  (w-36)
const CONN_W   = 1.5;  // rem  (w-6)
const CHILD_PAD = 0.25; // rem  (px-1 pada wrapper anak)
// anchor ke tengah kartu anak = CHILD_PAD + CARD_W/2
const CHILD_ANCHOR_REM = CHILD_PAD + CARD_W / 2; // 4.75rem

// ─── Sub-komponen: distribusi anak di bawah 1 group ────────────────────────

function ChildrenSection({
  group,
  highlightId,
  collapsed,
  onToggle,
  anchorFromLeft, // rem: posisi garis vertikal dari kiri seluruh baris pasangan
}: {
  group: TreePartnerGroup;
  highlightId?: string;
  collapsed: boolean;
  onToggle?: () => void;
  anchorFromLeft: number; // rem
}) {
  if (group.children.length === 0) return null;
  const childAnchor = `${CHILD_ANCHOR_REM}rem`;

  return (
    // Posisikan container ini tepat di bawah anchor group-nya
    <div
      className="flex flex-col"
      style={{ paddingLeft: `${anchorFromLeft}rem` }}
    >
      {/* Garis dari baris pasangan ke toggle */}
      <div className="h-4 w-px bg-zinc-300 dark:bg-zinc-600" />

      {onToggle ? (
        <ToggleButton collapsed={collapsed} onToggle={onToggle} />
      ) : (
        <div className="h-5 w-px bg-zinc-300 dark:bg-zinc-600" />
      )}

      {!collapsed && (
        <>
          {/* Garis dari toggle ke H-bar */}
          <div className="h-4 w-px bg-zinc-300 dark:bg-zinc-600" />

          {/*
           * Geser container anak ke kiri agar CHILD_ANCHOR anak pertama
           * tepat sejajar dengan garis vertikal group ini.
           * marginLeft = -(anchorFromLeft - CHILD_ANCHOR_REM)
           */}
          <div
            className="flex items-start gap-0"
            style={{ marginLeft: `${-(anchorFromLeft - CHILD_ANCHOR_REM)}rem` }}
          >
            {group.children.map((child, idx) => {
              const isFirst = idx === 0;
              const isLast  = idx === group.children.length - 1;
              const isOnly  = group.children.length === 1;

              return (
                <div
                  key={`${group.relationshipId ?? group.partner?.id ?? "single"}-${child.member.id}`}
                  className="relative flex flex-col items-start"
                >
                  {/* H-bar + garis vertikal turun */}
                  <div className="relative h-4 w-full">
                    {!isOnly && !isFirst && (
                      <div
                        className="absolute top-0 h-px bg-zinc-300 dark:bg-zinc-600"
                        style={{ left: 0, right: `calc(100% - ${childAnchor})` }}
                      />
                    )}
                    <div
                      className="absolute top-0 h-4 w-px bg-zinc-300 dark:bg-zinc-600"
                      style={{ left: childAnchor, transform: "translateX(-50%)" }}
                    />
                    {!isOnly && !isLast && (
                      <div
                        className="absolute top-0 right-0 h-px bg-zinc-300 dark:bg-zinc-600"
                        style={{ left: childAnchor }}
                      />
                    )}
                  </div>

                  <div className="px-1 sm:px-2">
                    <TreeNode node={child} highlightId={highlightId} />
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

// ─── TreeNode utama ─────────────────────────────────────────────────────────

export default function TreeNode({ node, highlightId }: TreeNodeProps) {
  const [collapsed, setCollapsed] = useState(false);

  const visibleGroups = useMemo(() => {
    const groups = node.partnerGroups.filter(
      (group) => group.partner || group.children.length > 0,
    );
    return groups.length > 0
      ? groups
      : [{ partner: null, status: "single-parent" as const, children: [], relationshipId: undefined }];
  }, [node.partnerGroups]);

  const firstWithChildrenIdx = visibleGroups.findIndex((g) => g.children.length > 0);

  /*
   * ═══════════════════════════════════════════════════════════════
   *  LAYOUT BARIS PASANGAN
   *
   *  Semua group di-render dalam 1 baris horizontal:
   *
   *    [partnerN]──×──[X]──[partnerZ]
   *    group[0]        group[1]
   *    (kiri X)        (kanan X)
   *
   *  Aturan distribusi group ke kiri/kanan X:
   *  - Group pertama (index 0) → partner di KIRI X jika ada lebih dari 1 group
   *    (supaya X tidak tersebut dua kali, group pertama menaruh partnernya di kiri)
   *  - Group selanjutnya → partner di KANAN X, berurutan ke kanan
   *  - Jika hanya 1 group → render normal (partner di kanan)
   *
   *  X hanya dirender 1x, di antara group kiri dan group kanan pertama.
   *
   *  Anchor tiap group (dari kiri baris):
   *    group kiri  (partner di kiri X):
   *      anchor = CARD_W/2  (center connector antara partnerKiri dan X)
   *             = CARD_W + CONN_W/2  → midpoint garis pernikahan kiri
   *    group kanan ke-n (partner di kanan X):
   *      offset_X = lebar semua grup kiri + CARD_W
   *      anchor   = offset_X + CONN_W/2  → midpoint garis pernikahan kanan ke-n
   * ═══════════════════════════════════════════════════════════════
   */

  const isSingle = visibleGroups.length === 1;

  // Pisahkan: group pertama jadi kiri jika ada >1 group dan punya partner
  const leftGroups  = (!isSingle && visibleGroups[0].partner)
    ? [visibleGroups[0]]
    : [];
  const rightGroups = (!isSingle && visibleGroups[0].partner)
    ? visibleGroups.slice(1)
    : visibleGroups;

  /*
   * Hitung anchorFromLeft tiap group (posisi midpoint garis pernikahan
   * dari kiri seluruh baris pasangan).
   *
   * Struktur baris (kiri ke kanan):
   *   [leftPartner0] [CONN] [X] [CONN] [rightPartner0] [CONN] [rightPartner1] ...
   *
   * left group ke-i anchor = CARD_W/2 + i*(CARD_W+CONN_W)  → semua kiri
   *   (tidak berlaku untuk >1 pasangan kiri, tapi kita hanya izinkan 1 grup kiri)
   *
   * offset X dari kiri = leftGroups.length * (CARD_W + CONN_W)
   *
   * right group ke-j anchor = offsetX + CARD_W + CONN_W/2 + j*(CARD_W+CONN_W)
   */
  const offsetX = leftGroups.length * (CARD_W + CONN_W);  // rem: kiri edge kartu X

  // anchor tiap group kiri (hanya 1 yang diizinkan sekarang)
  const leftAnchors  = leftGroups.map((_, i) =>
    i * (CARD_W + CONN_W) + CARD_W + CONN_W / 2,
  );

  // anchor tiap group kanan
  const rightAnchors = rightGroups.map((_, j) =>
    offsetX + CARD_W + CONN_W / 2 + j * (CARD_W + CONN_W),
  );

  // anchor jika single (no partner)
  const singleAnchor = offsetX + CARD_W / 2;

  return (
    <div className="flex flex-col items-start">

      {/* ── Baris Pasangan (semua group dalam 1 baris) ── */}
      <div className="flex items-center">
        {/* Partner kiri */}
        {leftGroups.map((g) => (
          <div key={`left-${g.relationshipId ?? g.partner?.id}`} className="flex items-center">
            <MemberCard member={g.partner!} isHighlighted={g.partner!.id === highlightId} />
            <PartnerConnector status={g.status} />
          </div>
        ))}

        {/* Kartu X — muncul sekali */}
        <MemberCard member={node.member} isHighlighted={node.member.id === highlightId} />

        {/* Partner kanan */}
        {rightGroups.map((g) =>
          g.partner ? (
            <div key={`right-${g.relationshipId ?? g.partner.id}`} className="flex items-center">
              <PartnerConnector status={g.status} />
              <MemberCard member={g.partner} isHighlighted={g.partner.id === highlightId} />
            </div>
          ) : null,
        )}
      </div>

      {/* ── ChildrenSection per group ── */}
      <div className="relative flex flex-col">
        {leftGroups.map((g, i) => (
          <ChildrenSection
            key={`lc-${g.relationshipId ?? g.partner?.id ?? i}`}
            group={g}
            highlightId={highlightId}
            collapsed={collapsed}
            anchorFromLeft={leftAnchors[i]}
            onToggle={
              visibleGroups.indexOf(g) === firstWithChildrenIdx
                ? () => setCollapsed((v) => !v)
                : undefined
            }
          />
        ))}
        {rightGroups.map((g, j) => (
          <ChildrenSection
            key={`rc-${g.relationshipId ?? g.partner?.id ?? j}`}
            group={g}
            highlightId={highlightId}
            collapsed={collapsed}
            anchorFromLeft={isSingle && !g.partner ? singleAnchor : rightAnchors[j]}
            onToggle={
              visibleGroups.indexOf(g) === firstWithChildrenIdx
                ? () => setCollapsed((v) => !v)
                : undefined
            }
          />
        ))}
      </div>

    </div>
  );
}