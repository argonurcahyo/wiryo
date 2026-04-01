"use client";

import { useMemo, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { TreeNode as TNode, TreePartnerGroup } from "@/lib/tree";

// ─── Shared constants ──────────────────────────────────────────────────────────
const CARD_W   = 116;
const CARD_H   = 46;
const CONN_W   = 20;
const COL_GAP  = 12;
const TOGGLE_R = 9;
const V_STUB   = 14;
const LINE_CLR = "var(--tree-line, #71717a)";
const PADDING  = 32;

// ─── Shared helpers ────────────────────────────────────────────────────────────

function fitName(name: string): [string, string | undefined] {
  const MAX = 15;
  if (name.length <= MAX) return [name, undefined];
  const sp = name.lastIndexOf(" ", MAX);
  if (sp > 0) {
    const l2 = name.slice(sp + 1);
    return [name.slice(0, sp), l2.length > MAX ? l2.slice(0, MAX - 1) + "\u2026" : l2];
  }
  return [name.slice(0, MAX - 1) + "\u2026", undefined];
}

function MemberCardSvg({
  member, isHighlighted, x, y, w = CARD_W, h = CARD_H,
}: {
  member: TNode["member"];
  isHighlighted: boolean;
  x: number; y: number;
  w?: number; h?: number;
}) {
  const bg = isHighlighted ? "#10b981"
    : member.gender === "L" ? "#3b82f6"
    : member.gender === "P" ? "#f43f5e"
    : "#71717a";
  const border = isHighlighted ? "#059669"
    : member.gender === "L" ? "#2563eb"
    : member.gender === "P" ? "#e11d48"
    : "#52525b";

  const [line1, line2] = fitName(member.name);
  const hasDate = !!member.birthDate;
  const LINE_H = 16;
  const nameLines = line2 ? 2 : 1;
  const contentH = nameLines * LINE_H + (hasDate ? 14 : 0);
  const baseY = y + (h - contentH) / 2 + 13;

  return (
    <a href={`/members/${member.id}`} style={{ cursor: "pointer" }}>
      <rect x={x} y={y} width={w} height={h} rx={8}
        fill={bg} stroke={border} strokeWidth={2} />
      <text x={x + w / 2} y={baseY} textAnchor="middle" fontSize={13} fontWeight="800"
        fill="#ffffff" fontFamily="system-ui,-apple-system,sans-serif">{line1}</text>
      {line2 && (
        <text x={x + w / 2} y={baseY + LINE_H} textAnchor="middle" fontSize={13} fontWeight="800"
          fill="#ffffff" fontFamily="system-ui,-apple-system,sans-serif">{line2}</text>
      )}
      {hasDate && (
        <text x={x + w / 2} y={baseY + nameLines * LINE_H} textAnchor="middle" fontSize={11}
          fontWeight="600" fill="#ffffff" opacity={0.9}
          fontFamily="system-ui,-apple-system,sans-serif">{member.birthDate}</text>
      )}
    </a>
  );
}

function ToggleSvg({
  x, y, collapsed, onClick,
}: {
  x: number; y: number; collapsed: boolean; onClick: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <g onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ cursor: "pointer" }}>
      <circle cx={x} cy={y} r={TOGGLE_R}
        fill="white" stroke={hovered ? "#10b981" : "#d1d5db"} strokeWidth={1.5} />
      <line x1={x - 4.5} y1={y} x2={x + 4.5} y2={y}
        stroke={hovered ? "#10b981" : "#6b7280"} strokeWidth={1.5} strokeLinecap="round" />
      {collapsed && (
        <line x1={x} y1={y - 4.5} x2={x} y2={y + 4.5}
          stroke={hovered ? "#10b981" : "#6b7280"} strokeWidth={1.5} strokeLinecap="round" />
      )}
    </g>
  );
}

// ════════════════════════════════════════════════════════════════════════════════
// VERTICAL MODE  (top → down)
// ════════════════════════════════════════════════════════════════════════════════

interface VLayoutGroup {
  coupleAnchorX: number;
  coupleLeft: number;
  coupleExtraWidth: number;
  side: "left" | "right" | "none";
  partnerX: number;
  connectorX: number;
  childrenLayout: VLayoutNode[];
  childrenTotalWidth: number;
  childrenAnchorX: number;
  group: TreePartnerGroup;
}
interface VLayoutNode {
  node: TNode;
  x: number;
  width: number;
  anchorX: number;
  children: VLayoutGroup[];
}

function vLayoutNode(node: TNode, collapsed: Set<string>): VLayoutNode {
  const visibleGroups = node.partnerGroups.filter(
    (g) => g.partner !== null || g.children.length > 0
  );
  if (visibleGroups.length === 0) {
    return { node, x: 0, width: CARD_W, anchorX: CARD_W / 2, children: [] };
  }
  const hasMultiple = visibleGroups.length > 1 && visibleGroups[0].partner !== null;
  const leftGroups  = hasMultiple ? [visibleGroups[0]] : [];
  const rightGroups = hasMultiple ? visibleGroups.slice(1) : visibleGroups;
  const leftWidth   = leftGroups.reduce((acc) => acc + CARD_W + CONN_W, 0);
  const xCardLeft   = leftWidth;
  const layoutGroups: VLayoutGroup[] = [];

  for (let i = 0; i < leftGroups.length; i++) {
    const g = leftGroups[i];
    const partnerX      = i * (CARD_W + CONN_W);
    const connectorX    = partnerX + CARD_W;
    const coupleAnchorX = connectorX + CONN_W / 2;
    const nodeKey = `${node.member.id}-${g.relationshipId ?? g.partner?.id ?? "left"}`;
    let childrenLayouts: VLayoutNode[] = [];
    let childrenTotalWidth = 0;
    if (!collapsed.has(nodeKey) && g.children.length > 0) {
      childrenLayouts = g.children.map((c) => vLayoutNode(c, collapsed));
      childrenTotalWidth = childrenLayouts.reduce((s, c) => s + c.width, 0)
        + COL_GAP * Math.max(0, childrenLayouts.length - 1);
      let cx = 0;
      for (const cl of childrenLayouts) { cl.x = cx; cx += cl.width + COL_GAP; }
    }
    layoutGroups.push({
      coupleAnchorX, coupleLeft: partnerX, coupleExtraWidth: CARD_W + CONN_W,
      side: "left", partnerX, connectorX,
      childrenLayout: childrenLayouts, childrenTotalWidth,
      childrenAnchorX: coupleAnchorX, group: g,
    });
  }

  for (let j = 0; j < rightGroups.length; j++) {
    const g = rightGroups[j];
    if (g.partner === null) {
      const spKey = `${node.member.id}-single`;
      let childrenLayouts: VLayoutNode[] = [];
      let childrenTotalWidth = 0;
      if (!collapsed.has(spKey) && g.children.length > 0) {
        childrenLayouts = g.children.map((c) => vLayoutNode(c, collapsed));
        childrenTotalWidth = childrenLayouts.reduce((s, c) => s + c.width, 0)
          + COL_GAP * Math.max(0, childrenLayouts.length - 1);
        let cx = 0;
        for (const cl of childrenLayouts) { cl.x = cx; cx += cl.width + COL_GAP; }
      }
      layoutGroups.push({
        coupleAnchorX: xCardLeft + CARD_W / 2, coupleLeft: xCardLeft,
        coupleExtraWidth: 0, side: "none", partnerX: -1, connectorX: -1,
        childrenLayout: childrenLayouts, childrenTotalWidth,
        childrenAnchorX: xCardLeft + CARD_W / 2, group: g,
      });
      continue;
    }
    const connectorX    = xCardLeft + CARD_W + j * (CARD_W + CONN_W);
    const partnerX      = connectorX + CONN_W;
    const coupleAnchorX = connectorX + CONN_W / 2;
    const nodeKey = `${node.member.id}-${g.relationshipId ?? g.partner.id ?? `right-${j}`}`;
    let childrenLayouts: VLayoutNode[] = [];
    let childrenTotalWidth = 0;
    if (!collapsed.has(nodeKey) && g.children.length > 0) {
      childrenLayouts = g.children.map((c) => vLayoutNode(c, collapsed));
      childrenTotalWidth = childrenLayouts.reduce((s, c) => s + c.width, 0)
        + COL_GAP * Math.max(0, childrenLayouts.length - 1);
      let cx = 0;
      for (const cl of childrenLayouts) { cl.x = cx; cx += cl.width + COL_GAP; }
    }
    layoutGroups.push({
      coupleAnchorX, coupleLeft: connectorX, coupleExtraWidth: CONN_W + CARD_W,
      side: "right", partnerX, connectorX,
      childrenLayout: childrenLayouts, childrenTotalWidth,
      childrenAnchorX: coupleAnchorX, group: g,
    });
  }

  const coupleRowWidth = leftWidth + CARD_W
    + rightGroups.filter((g) => g.partner !== null).length * (CARD_W + CONN_W);
  let totalLeft = 0, totalRight = coupleRowWidth;
  for (const lg of layoutGroups) {
    if (lg.childrenTotalWidth === 0 || lg.childrenLayout.length === 0) continue;
    const first = lg.childrenLayout[0];
    const last  = lg.childrenLayout[lg.childrenLayout.length - 1];
    const midAnchor = (first.anchorX + last.x + last.anchorX) / 2;
    totalLeft  = Math.min(totalLeft, lg.coupleAnchorX - midAnchor);
    totalRight = Math.max(totalRight, lg.coupleAnchorX - midAnchor + lg.childrenTotalWidth);
  }
  const offset = -totalLeft;
  for (const lg of layoutGroups) {
    lg.partnerX += offset; lg.connectorX += offset;
    lg.coupleAnchorX += offset; lg.coupleLeft += offset; lg.childrenAnchorX += offset;
    if (lg.childrenTotalWidth > 0 && lg.childrenLayout.length > 0) {
      const first = lg.childrenLayout[0];
      const last  = lg.childrenLayout[lg.childrenLayout.length - 1];
      const midAnchor = (first.anchorX + last.x + last.anchorX) / 2;
      const startX = lg.coupleAnchorX - midAnchor;
      for (const cl of lg.childrenLayout) cl.x += startX;
    }
  }
  return {
    node, x: 0, width: Math.max(totalRight - totalLeft, coupleRowWidth + offset),
    anchorX: xCardLeft + offset + CARD_W / 2, children: layoutGroups,
  };
}

function vComputeHeight(layout: VLayoutNode, collapsed: Set<string>): number {
  let maxH = 0;
  for (const lg of layout.children) {
    const g = lg.group;
    const key = g.partner
      ? `${layout.node.member.id}-${g.relationshipId ?? g.partner.id}`
      : `${layout.node.member.id}-single`;
    if (lg.group.children.length === 0 || collapsed.has(key)) continue;
    const connH = CARD_H + V_STUB + TOGGLE_R * 2 + V_STUB;
    const childMax = Math.max(...lg.childrenLayout.map((cl) => vComputeHeight(cl, collapsed)));
    maxH = Math.max(maxH, connH + childMax);
  }
  return CARD_H + maxH;
}

interface VRenderCtx {
  highlightId?: string;
  collapsed: Set<string>;
  onToggle: (key: string) => void;
}

function vRenderNode(layout: VLayoutNode, ox: number, oy: number, ctx: VRenderCtx): React.ReactNode[] {
  const els: React.ReactNode[] = [];
  const { node } = layout;
  const xCardLeft = ox + layout.anchorX - CARD_W / 2;

  els.push(
    <MemberCardSvg key={`card-${node.member.id}`} member={node.member}
      isHighlighted={node.member.id === ctx.highlightId} x={xCardLeft} y={oy} />
  );

  for (const lg of layout.children) {
    const g = lg.group;
    const nodeKey = g.partner
      ? `${node.member.id}-${g.relationshipId ?? g.partner.id}`
      : `${node.member.id}-single`;

    if (g.partner) {
      const pX = ox + lg.partnerX, cX = ox + lg.connectorX, midY = oy + CARD_H / 2;
      if (g.status === "former") {
        const mx = cX + CONN_W / 2;
        els.push(
          <line key={`cl-${nodeKey}`} x1={cX} y1={midY} x2={mx - 6} y2={midY} stroke={LINE_CLR} strokeWidth={2} />,
          <line key={`cr-${nodeKey}`} x1={mx + 6} y1={midY} x2={cX + CONN_W} y2={midY} stroke={LINE_CLR} strokeWidth={2} />,
          <circle key={`cc-${nodeKey}`} cx={mx} cy={midY} r={6} fill="white" stroke={LINE_CLR} strokeWidth={2} />,
          <line key={`cx1-${nodeKey}`} x1={mx - 2.5} y1={midY - 2.5} x2={mx + 2.5} y2={midY + 2.5} stroke="#9ca3af" strokeWidth={2} strokeLinecap="round" />,
          <line key={`cx2-${nodeKey}`} x1={mx + 2.5} y1={midY - 2.5} x2={mx - 2.5} y2={midY + 2.5} stroke="#9ca3af" strokeWidth={2} strokeLinecap="round" />,
        );
      } else {
        els.push(<line key={`conn-${nodeKey}`} x1={cX} y1={midY} x2={cX + CONN_W} y2={midY} stroke={LINE_CLR} strokeWidth={2} />);
      }
      els.push(
        <MemberCardSvg key={`card-${g.partner.id}`} member={g.partner}
          isHighlighted={g.partner.id === ctx.highlightId} x={pX} y={oy} />
      );

      if (lg.group.children.length > 0) {
        const ax = ox + lg.coupleAnchorX, isC = ctx.collapsed.has(nodeKey);
        const ty = oy + CARD_H + V_STUB + TOGGLE_R;
        els.push(
          <line key={`v-${nodeKey}`} x1={ax} y1={midY} x2={ax} y2={isC ? ty : ty + TOGGLE_R + V_STUB} stroke={LINE_CLR} strokeWidth={2} />,
          <ToggleSvg key={`tgl-${nodeKey}`} x={ax} y={ty} collapsed={isC} onClick={() => ctx.onToggle(nodeKey)} />
        );
        if (!isC) {
          const cy2 = oy + CARD_H + V_STUB + TOGGLE_R * 2 + V_STUB;
          const fc = lg.childrenLayout[0], lc = lg.childrenLayout[lg.childrenLayout.length - 1];
          if (lg.childrenLayout.length > 1)
            els.push(<line key={`hb-${nodeKey}`} x1={ox + fc.x + fc.anchorX} y1={cy2} x2={ox + lc.x + lc.anchorX} y2={cy2} stroke={LINE_CLR} strokeWidth={2} />);
          for (const cl of lg.childrenLayout) {
            const ca = ox + cl.x + cl.anchorX;
            els.push(<line key={`vs-${nodeKey}-${cl.node.member.id}`} x1={ca} y1={cy2} x2={ca} y2={cy2 + V_STUB} stroke={LINE_CLR} strokeWidth={2} />);
            els.push(...vRenderNode(cl, ox + cl.x, cy2 + V_STUB, ctx));
          }
        }
      }
    } else {
      if (lg.group.children.length > 0) {
        const ax = ox + lg.coupleAnchorX, isC = ctx.collapsed.has(nodeKey), midY = oy + CARD_H / 2;
        const ty = oy + CARD_H + V_STUB + TOGGLE_R;
        els.push(
          <line key={`v-${nodeKey}`} x1={ax} y1={midY} x2={ax} y2={isC ? ty : ty + TOGGLE_R + V_STUB} stroke={LINE_CLR} strokeWidth={2} />,
          <ToggleSvg key={`tgl-${nodeKey}`} x={ax} y={ty} collapsed={isC} onClick={() => ctx.onToggle(nodeKey)} />
        );
        if (!isC) {
          const cy2 = oy + CARD_H + V_STUB + TOGGLE_R * 2 + V_STUB;
          const fc = lg.childrenLayout[0], lc = lg.childrenLayout[lg.childrenLayout.length - 1];
          if (lg.childrenLayout.length > 1)
            els.push(<line key={`hb-${nodeKey}`} x1={ox + fc.x + fc.anchorX} y1={cy2} x2={ox + lc.x + lc.anchorX} y2={cy2} stroke={LINE_CLR} strokeWidth={2} />);
          for (const cl of lg.childrenLayout) {
            const ca = ox + cl.x + cl.anchorX;
            els.push(<line key={`vs-${nodeKey}-${cl.node.member.id}`} x1={ca} y1={cy2} x2={ca} y2={cy2 + V_STUB} stroke={LINE_CLR} strokeWidth={2} />);
            els.push(...vRenderNode(cl, ox + cl.x, cy2 + V_STUB, ctx));
          }
        }
      }
    }
  }
  return els;
}

// ════════════════════════════════════════════════════════════════════════════════
// HORIZONTAL MODE  (left → right)
// X card on left, children grow rightward.
// Partner card is below the X card, connected by a short vertical line.
// ════════════════════════════════════════════════════════════════════════════════

interface HLayoutGroup {
  coupleTopY: number;     // top of couple block (node-local)
  partnerY: number;       // top of partner card (node-local), -1 if none
  coupleAnchorY: number;  // y of midpoint connector / anchor (node-local)
  coupleBlockH: number;
  side: "below" | "none";
  childrenLayout: HLayoutNode[];
  childrenTotalHeight: number;
  childrenAnchorY: number;
  group: TreePartnerGroup;
}
interface HLayoutNode {
  node: TNode;
  y: number;
  height: number;
  anchorY: number;    // y of X card midpoint within block
  children: HLayoutGroup[];
}

function hLayoutNode(node: TNode, collapsed: Set<string>): HLayoutNode {
  const visibleGroups = node.partnerGroups.filter(
    (g) => g.partner !== null || g.children.length > 0
  );
  if (visibleGroups.length === 0) {
    return { node, y: 0, height: CARD_H, anchorY: CARD_H / 2, children: [] };
  }

  const layoutGroups: HLayoutGroup[] = [];
  let totalHeight = 0;

  for (let gi = 0; gi < visibleGroups.length; gi++) {
    const g = visibleGroups[gi];
    const nodeKey = g.partner
      ? `${node.member.id}-${g.relationshipId ?? g.partner.id ?? `p-${gi}`}`
      : `${node.member.id}-single`;

    let childrenLayouts: HLayoutNode[] = [];
    let childrenTotalHeight = 0;
    if (!collapsed.has(nodeKey) && g.children.length > 0) {
      childrenLayouts = g.children.map((c) => hLayoutNode(c, collapsed));
      childrenTotalHeight = childrenLayouts.reduce((s, c) => s + c.height, 0)
        + COL_GAP * Math.max(0, childrenLayouts.length - 1);
      let cy = 0;
      for (const cl of childrenLayouts) { cl.y = cy; cy += cl.height + COL_GAP; }
    }

    const isLast = gi === visibleGroups.length - 1;
    if (g.partner === null) {
      const groupH = Math.max(CARD_H, childrenTotalHeight);
      layoutGroups.push({
        coupleTopY: totalHeight, partnerY: -1,
        coupleAnchorY: totalHeight + CARD_H / 2,
        coupleBlockH: CARD_H, side: "none",
        childrenLayout: childrenLayouts, childrenTotalHeight,
        childrenAnchorY: totalHeight + CARD_H / 2, group: g,
      });
      totalHeight += groupH + (isLast ? 0 : COL_GAP);
    } else {
      const coupleH = CARD_H + CONN_W + CARD_H;
      const anchorInGroup = CARD_H + CONN_W / 2;
      const groupH = Math.max(coupleH, childrenTotalHeight);
      layoutGroups.push({
        coupleTopY: totalHeight, partnerY: totalHeight + CARD_H + CONN_W,
        coupleAnchorY: totalHeight + anchorInGroup,
        coupleBlockH: coupleH, side: "below",
        childrenLayout: childrenLayouts, childrenTotalHeight,
        childrenAnchorY: totalHeight + anchorInGroup, group: g,
      });
      totalHeight += groupH + (isLast ? 0 : COL_GAP * 2);
    }
  }

  return { node, y: 0, height: totalHeight, anchorY: CARD_H / 2, children: layoutGroups };
}

function hComputeWidth(layout: HLayoutNode, collapsed: Set<string>): number {
  let maxChildW = 0;
  for (const lg of layout.children) {
    const g = lg.group;
    const key = g.partner
      ? `${layout.node.member.id}-${g.relationshipId ?? g.partner.id}`
      : `${layout.node.member.id}-single`;
    if (lg.group.children.length === 0 || collapsed.has(key)) continue;
    const connW = V_STUB + TOGGLE_R * 2 + V_STUB;
    const childMax = Math.max(...lg.childrenLayout.map((cl) => hComputeWidth(cl, collapsed)));
    maxChildW = Math.max(maxChildW, connW + childMax);
  }
  return CARD_W + maxChildW;
}

interface HRenderCtx {
  highlightId?: string;
  collapsed: Set<string>;
  onToggle: (key: string) => void;
}

function hRenderNode(layout: HLayoutNode, ox: number, oy: number, ctx: HRenderCtx): React.ReactNode[] {
  const els: React.ReactNode[] = [];
  const { node } = layout;
  const xCardY = oy; // X card always at top of block

  els.push(
    <MemberCardSvg key={`card-${node.member.id}`} member={node.member}
      isHighlighted={node.member.id === ctx.highlightId} x={ox} y={xCardY} />
  );

  for (const lg of layout.children) {
    const g = lg.group;
    const nodeKey = g.partner
      ? `${node.member.id}-${g.relationshipId ?? g.partner.id}`
      : `${node.member.id}-single`;
    const coupleAnchorAbsY = oy + lg.coupleAnchorY;

    if (g.partner) {
      const pY     = oy + lg.partnerY;
      const connX  = ox + CARD_W / 2;
      const connT  = oy + lg.coupleTopY + CARD_H;
      const connB  = pY;
      const connM  = (connT + connB) / 2;

      if (g.status === "former") {
        els.push(
          <line key={`ct-${nodeKey}`} x1={connX} y1={connT} x2={connX} y2={connM - 6} stroke={LINE_CLR} strokeWidth={2} />,
          <line key={`cb-${nodeKey}`} x1={connX} y1={connM + 6} x2={connX} y2={connB} stroke={LINE_CLR} strokeWidth={2} />,
          <circle key={`cc-${nodeKey}`} cx={connX} cy={connM} r={6} fill="white" stroke={LINE_CLR} strokeWidth={2} />,
          <line key={`cx1-${nodeKey}`} x1={connX - 2.5} y1={connM - 2.5} x2={connX + 2.5} y2={connM + 2.5} stroke="#9ca3af" strokeWidth={2} strokeLinecap="round" />,
          <line key={`cx2-${nodeKey}`} x1={connX + 2.5} y1={connM - 2.5} x2={connX - 2.5} y2={connM + 2.5} stroke="#9ca3af" strokeWidth={2} strokeLinecap="round" />,
        );
      } else {
        els.push(<line key={`conn-${nodeKey}`} x1={connX} y1={connT} x2={connX} y2={connB} stroke={LINE_CLR} strokeWidth={2} />);
      }
      els.push(
        <MemberCardSvg key={`card-${g.partner.id}`} member={g.partner}
          isHighlighted={g.partner.id === ctx.highlightId} x={ox} y={pY} />
      );
    }

    // Children branch to the right
    if (lg.group.children.length > 0) {
      const isC = ctx.collapsed.has(nodeKey);
      const toggleX = ox + CARD_W + V_STUB + TOGGLE_R;
      const lineEndX = isC ? toggleX : toggleX + TOGGLE_R + V_STUB;
      // For couples: the connector is at CARD_W/2 (centre of both cards),
      // so the branch must start there to visually connect to it.
      // For single-parent: anchor is at card centre-right, start from card edge.
      const branchStartX = g.partner ? ox + CARD_W / 2 : ox + CARD_W;

      els.push(
        <line key={`h-${nodeKey}`} x1={branchStartX} y1={coupleAnchorAbsY} x2={lineEndX} y2={coupleAnchorAbsY} stroke={LINE_CLR} strokeWidth={2} />,
        <ToggleSvg key={`tgl-${nodeKey}`} x={toggleX} y={coupleAnchorAbsY} collapsed={isC} onClick={() => ctx.onToggle(nodeKey)} />
      );

      if (!isC && lg.childrenLayout.length > 0) {
        const childrenX = ox + CARD_W + V_STUB + TOGGLE_R * 2 + V_STUB;
        const fc = lg.childrenLayout[0], lc = lg.childrenLayout[lg.childrenLayout.length - 1];
        const vTop    = oy + fc.y + fc.anchorY;
        const vBottom = oy + lc.y + lc.anchorY;
        const barTop    = Math.min(coupleAnchorAbsY, vTop);
        const barBottom = Math.max(coupleAnchorAbsY, vBottom);
        const hChildEls: React.ReactNode[] = [];
        hChildEls.push(<line key={`vb-${nodeKey}`} x1={childrenX} y1={barTop} x2={childrenX} y2={barBottom} stroke={LINE_CLR} strokeWidth={2} />);
        for (const cl of lg.childrenLayout) {
          const clAbsY = oy + cl.y + cl.anchorY;
          hChildEls.push(<line key={`hs-${nodeKey}-${cl.node.member.id}`} x1={childrenX} y1={clAbsY} x2={childrenX + V_STUB} y2={clAbsY} stroke={LINE_CLR} strokeWidth={2} />);
          hChildEls.push(...hRenderNode(cl, childrenX + V_STUB, oy + cl.y, ctx));
        }
        els.push(
          <motion.g
            key={`hcg-${nodeKey}`}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -8 }}
            transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
          >
            {hChildEls}
          </motion.g>
        );
      }
    }
  }
  return els;
}

// ════════════════════════════════════════════════════════════════════════════════
// Main exported component
// ════════════════════════════════════════════════════════════════════════════════

export default function TreeNodeSvg({
  node, highlightId, orientation = "vertical",
}: {
  node: TNode;
  highlightId?: string;
  orientation?: "vertical" | "horizontal";
}) {
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  const onToggle = useCallback((key: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  }, []);

  const vLayout = useMemo(() => vLayoutNode(node, collapsed), [node, collapsed]);
  const hLayout = useMemo(() => hLayoutNode(node, collapsed), [node, collapsed]);

  if (orientation === "horizontal") {
    const svgW = hComputeWidth(hLayout, collapsed) + PADDING * 2;
    const svgH = hLayout.height + PADDING * 2;
    const ctx: HRenderCtx = { highlightId, collapsed, onToggle };
    return (
      <motion.svg
        width={svgW} height={svgH}
        viewBox={`0 0 ${svgW} ${svgH}`}
        animate={{ width: svgW, height: svgH }}
        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
        style={{ overflow: "visible", display: "block" }}
      >
        <AnimatePresence>
          {hRenderNode(hLayout, PADDING, PADDING, ctx)}
        </AnimatePresence>
      </motion.svg>
    );
  }

  // vertical (default)
  const svgW = vLayout.width + PADDING * 2;
  const svgH = vComputeHeight(vLayout, collapsed) + PADDING * 2;
  const ctx: VRenderCtx = { highlightId, collapsed, onToggle };
  return (
    <motion.svg
      width={svgW} height={svgH}
      viewBox={`0 0 ${svgW} ${svgH}`}
      animate={{ width: svgW, height: svgH }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      style={{ overflow: "visible", display: "block" }}
    >
      <AnimatePresence>
        {vRenderNode(vLayout, PADDING, PADDING, ctx)}
      </AnimatePresence>
    </motion.svg>
  );
}
