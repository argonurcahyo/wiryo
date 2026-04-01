"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
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
    "relative z-10 inline-flex w-36 flex-col items-center justify-center rounded-xl border px-2 py-2 text-center shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-lg hover:scale-105 active:scale-95";

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
        className="relative z-10 flex h-5 w-5 items-center justify-center rounded-full border border-zinc-300 bg-white text-zinc-500 shadow-sm transition-all duration-150 hover:scale-110 hover:border-emerald-400 hover:text-emerald-600 active:scale-90 active:bg-emerald-50 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-400 dark:active:bg-emerald-900/30"
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

/**
 * Merender garis vertikal + toggle + H-bar + kartu anak untuk SATU group.
 * Di-render sebagai kolom yang dimulai dari x=0 (kiri wrapper-nya sendiri).
 * Parent bertanggung jawab menempatkan wrapper ini di posisi horizontal yang benar.
 */
function ChildrenSection({
  group,
  highlightId,
  collapsed,
  onToggle,
}: {
  group: TreePartnerGroup;
  highlightId?: string;
  collapsed: boolean;
  onToggle?: () => void;
}) {
  if (group.children.length === 0) return null;
  const childAnchor = `${CHILD_ANCHOR_REM}rem`;

  return (
    <div className="flex flex-col">
      {/* Tidak ada h-4 di sini — T-junction row di parent sudah handle garis dari connector */}
      {onToggle ? (
        <ToggleButton collapsed={collapsed} onToggle={onToggle} />
      ) : (
        <div className="h-5 w-px bg-zinc-300 dark:bg-zinc-600" />
      )}

      <AnimatePresence initial={false}>
        {!collapsed && (
          <motion.div
            key="children"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            style={{ overflow: "hidden" }}
          >
            {/* Garis dari toggle ke H-bar */}
            <div className="h-4 w-px bg-zinc-300 dark:bg-zinc-600" />

            {/* Distribusi anak — geser kiri agar CHILD_ANCHOR anak[0] di x=0 */}
            <div
              className="flex items-start gap-0"
              style={{ marginLeft: `${-CHILD_ANCHOR_REM}rem` }}
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
          </motion.div>
        )}
      </AnimatePresence>
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

      {/*
       * ── T-junction row ──
       * Baris tipis (h-4) yang berisi garis vertikal pendek di posisi anchor
       * tiap group yang punya anak. Ini membentuk huruf T:
       * garis pernikahan horizontal (di baris pasangan) + batang vertikal (di sini).
       * Dilanjutkan oleh ChildrenSection di bawahnya.
       */}
      {(() => {
        const sectionsWithAnchor = [
          ...leftGroups
            .map((g, i) => ({ group: g, anchor: leftAnchors[i] }))
            .filter((s) => s.group.children.length > 0),
          ...rightGroups
            .map((g, j) => ({
              group: g,
              anchor: isSingle && !g.partner ? singleAnchor : rightAnchors[j],
            }))
            .filter((s) => s.group.children.length > 0),
        ];

        if (sectionsWithAnchor.length === 0) return null;

        // Lebar total baris pasangan (rem) — untuk sizing container relative
        const totalRowWidth =
          leftGroups.length * (CARD_W + CONN_W) +
          CARD_W +
          rightGroups.filter((g) => g.partner).length * (CONN_W + CARD_W);

        return (
          <>
            {/* T-junction: garis vertikal dari midpoint connector tiap group */}
            <div
              className="relative h-4 shrink-0"
              style={{ width: `${totalRowWidth}rem` }}
            >
              {sectionsWithAnchor.map(({ group, anchor }, si) => (
                <div
                  key={`tj-${group.relationshipId ?? group.partner?.id ?? si}`}
                  className="absolute top-0 h-full w-px bg-zinc-300 dark:bg-zinc-600"
                  style={{ left: `${anchor}rem`, transform: "translateX(-50%)" }}
                />
              ))}
            </div>

            {/* ChildrenSection — garis vertikal di sini menyambung dari T-junction */}
            <div className="flex flex-row items-start">
              {sectionsWithAnchor.map(({ group, anchor }, si) => {
                const prevAnchor = si === 0 ? 0 : sectionsWithAnchor[si - 1].anchor;
                const gIdx = visibleGroups.indexOf(group);
                return (
                  <div
                    key={`cs-${group.relationshipId ?? group.partner?.id ?? si}`}
                    style={{ paddingLeft: `${anchor - prevAnchor}rem` }}
                  >
                    <ChildrenSection
                      group={group}
                      highlightId={highlightId}
                      collapsed={collapsed}
                      onToggle={
                        gIdx === firstWithChildrenIdx
                          ? () => setCollapsed((v) => !v)
                          : undefined
                      }
                    />
                  </div>
                );
              })}
            </div>
          </>
        );
      })()}

    </div>
  );
}