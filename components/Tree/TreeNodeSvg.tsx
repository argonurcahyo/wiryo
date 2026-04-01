"use client";

import { useMemo, useState, useCallback } from "react";
import type { TreeNode as TNode, TreePartnerGroup } from "@/lib/tree";

// ─── Constants ────────────────────────────────────────────────────────────────
const CARD_W    = 116; // px
const CARD_H    = 46;  // px
const CONN_W    = 20;  // px
const ROW_GAP   = 64;  // px
const COL_GAP   = 12;  // px
const TOGGLE_R  = 9;   // px
const V_STUB    = 14;  // px
const LINE_CLR  = "var(--tree-line, #71717a)";
const LINE_CLR_D = "var(--tree-line-dark, #52525b)";

// ─── Layout types ─────────────────────────────────────────────────────────────

interface LayoutGroup {
  /** pixel offset of this group's "couple midpoint" from left of this node's block */
  coupleAnchorX: number;
  /** pixel offset of left edge of the first partner card from left of node block */
  coupleLeft: number;
  /** total width this group's couple row spans (excluding the shared X card) */
  coupleExtraWidth: number; // width added to the left or right of X
  side: "left" | "right" | "none"; // where the partner sits relative to X
  partnerX: number; // left edge of partner card in node-local coords
  connectorX: number; // left edge of connector in node-local coords
  childrenLayout: LayoutNode[];
  childrenTotalWidth: number;
  childrenAnchorX: number; // x of leftmost child's midpoint, node-local
  group: TreePartnerGroup;
}

interface LayoutNode {
  node: TNode;
  /** x of this node's block left edge, relative to parent ChildrenRow left */
  x: number;
  /** total width of this node's subtree block */
  width: number;
  /** x of this node's "couple anchor" within its own block (= local coupleAnchorX) */
  anchorX: number;
  children: LayoutGroup[];
}

// ─── Layout engine ────────────────────────────────────────────────────────────

/**
 * Returns the subtree width and layout for a node.
 * The node's X card always starts at some offset determined by left partners.
 */
function layoutNode(node: TNode, collapsed: Set<string>): LayoutNode {
  const visibleGroups = node.partnerGroups.filter(
    (g) => g.partner !== null || g.children.length > 0
  );

  if (visibleGroups.length === 0) {
    return { node, x: 0, width: CARD_W, anchorX: CARD_W / 2, children: [] };
  }

  // Separate groups: first group with partner → left side; rest → right side
  const hasMultiple = visibleGroups.length > 1 && visibleGroups[0].partner !== null;
  const leftGroups  = hasMultiple ? [visibleGroups[0]] : [];
  const rightGroups = hasMultiple ? visibleGroups.slice(1) : visibleGroups;

  // Width consumed left of X card
  const leftWidth = leftGroups.reduce((acc) => acc + CARD_W + CONN_W, 0);
  // X card starts at leftWidth
  const xCardLeft = leftWidth;

  // Build layout groups
  const layoutGroups: LayoutGroup[] = [];

  // LEFT groups (partner is to the LEFT of X)
  for (let i = 0; i < leftGroups.length; i++) {
    const g = leftGroups[i];
    const partnerX    = i * (CARD_W + CONN_W);
    const connectorX  = partnerX + CARD_W;
    const coupleAnchorX = connectorX + CONN_W / 2; // midpoint of connector

    // Layout children
    let childrenLayouts: LayoutNode[] = [];
    let childrenTotalWidth = 0;
    const nodeKey = `${node.member.id}-${g.relationshipId ?? g.partner?.id ?? "left"}`;

    if (!collapsed.has(nodeKey) && g.children.length > 0) {
      childrenLayouts = g.children.map((c) => layoutNode(c, collapsed));
      childrenTotalWidth = childrenLayouts.reduce((s, c) => s + c.width, 0)
        + COL_GAP * Math.max(0, childrenLayouts.length - 1);
      // position each child
      let cx = 0;
      for (const cl of childrenLayouts) {
        cl.x = cx;
        cx += cl.width + COL_GAP;
      }
    }

    const coupleBlockWidth = CARD_W + CONN_W; // partner + connector (X not counted here)
    const childrenAnchorX = coupleAnchorX; // children center under couple anchor

    layoutGroups.push({
      coupleAnchorX,
      coupleLeft: partnerX,
      coupleExtraWidth: coupleBlockWidth,
      side: "left",
      partnerX,
      connectorX,
      childrenLayout: childrenLayouts,
      childrenTotalWidth,
      childrenAnchorX,
      group: g,
    });
  }

  // RIGHT groups (partner is to the RIGHT of X)
  for (let j = 0; j < rightGroups.length; j++) {
    const g = rightGroups[j];
    const connectorX   = xCardLeft + CARD_W + j * (CARD_W + CONN_W);
    const partnerX     = connectorX + CONN_W;
    const coupleAnchorX = connectorX + CONN_W / 2;

    let childrenLayouts: LayoutNode[] = [];
    let childrenTotalWidth = 0;
    const nodeKey = `${node.member.id}-${g.relationshipId ?? g.partner?.id ?? `right-${j}`}`;

    if (g.partner === null) {
      // single-parent group
      const spKey = `${node.member.id}-single`;
      if (!collapsed.has(spKey) && g.children.length > 0) {
        childrenLayouts = g.children.map((c) => layoutNode(c, collapsed));
        childrenTotalWidth = childrenLayouts.reduce((s, c) => s + c.width, 0)
          + COL_GAP * Math.max(0, childrenLayouts.length - 1);
        let cx = 0;
        for (const cl of childrenLayouts) { cl.x = cx; cx += cl.width + COL_GAP; }
      }
      layoutGroups.push({
        coupleAnchorX: xCardLeft + CARD_W / 2,
        coupleLeft: xCardLeft,
        coupleExtraWidth: 0,
        side: "none",
        partnerX: -1,
        connectorX: -1,
        childrenLayout: childrenLayouts,
        childrenTotalWidth,
        childrenAnchorX: xCardLeft + CARD_W / 2,
        group: g,
      });
      continue;
    }

    if (!collapsed.has(nodeKey) && g.children.length > 0) {
      childrenLayouts = g.children.map((c) => layoutNode(c, collapsed));
      childrenTotalWidth = childrenLayouts.reduce((s, c) => s + c.width, 0)
        + COL_GAP * Math.max(0, childrenLayouts.length - 1);
      let cx = 0;
      for (const cl of childrenLayouts) { cl.x = cx; cx += cl.width + COL_GAP; }
    }

    layoutGroups.push({
      coupleAnchorX,
      coupleLeft: connectorX,
      coupleExtraWidth: CONN_W + CARD_W,
      side: "right",
      partnerX,
      connectorX,
      childrenLayout: childrenLayouts,
      childrenTotalWidth,
      childrenAnchorX: coupleAnchorX,
      group: g,
    });
  }

  // Total couple row width
  const coupleRowWidth =
    leftWidth +
    CARD_W +
    rightGroups.filter((g) => g.partner !== null).length * (CARD_W + CONN_W);

  // For each group, the children section needs to be centered under coupleAnchorX.
  // Compute how far left children extend beyond couple row, and how far right.
  let totalLeft  = 0; // max overflow to the left of x=0
  let totalRight = coupleRowWidth; // max right edge

  for (const lg of layoutGroups) {
    if (lg.childrenTotalWidth === 0 || lg.childrenLayout.length === 0) continue;
    const first = lg.childrenLayout[0];
    const last  = lg.childrenLayout[lg.childrenLayout.length - 1];
    // midAnchor = midpoint between leftmost and rightmost child anchor within the row
    const midAnchor = (first.anchorX + last.x + last.anchorX) / 2;
    const childrenLeft  = lg.coupleAnchorX - midAnchor;
    const childrenRight = childrenLeft + lg.childrenTotalWidth;
    totalLeft  = Math.min(totalLeft, childrenLeft);
    totalRight = Math.max(totalRight, childrenRight);
  }

  const offset = -totalLeft; // shift right to keep x≥0
  const totalWidth = totalRight - totalLeft;

  // Adjust all x positions by offset
  const xCardLeftAdj = xCardLeft + offset;
  for (const lg of layoutGroups) {
    lg.partnerX     += offset;
    lg.connectorX   += offset;
    lg.coupleAnchorX += offset;
    lg.coupleLeft   += offset;
    lg.childrenAnchorX += offset;

    // Shift children so they center under coupleAnchorX
    if (lg.childrenTotalWidth > 0 && lg.childrenLayout.length > 0) {
      const first = lg.childrenLayout[0];
      const last  = lg.childrenLayout[lg.childrenLayout.length - 1];
      const midAnchor = (first.anchorX + last.x + last.anchorX) / 2;
      const childrenStartX = lg.coupleAnchorX - midAnchor;
      for (const cl of lg.childrenLayout) {
        cl.x += childrenStartX;
      }
    }
  }

  return {
    node,
    x: 0,
    width: Math.max(totalWidth, coupleRowWidth + offset),
    anchorX: xCardLeftAdj + CARD_W / 2,
    children: layoutGroups,
  };
}

// ─── Render helpers ───────────────────────────────────────────────────────────

/** Split a name into up to 2 lines that each fit within ~15 chars. */
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
  member,
  isHighlighted,
  x,
  y,
}: {
  member: TNode["member"];
  isHighlighted: boolean;
  x: number;
  y: number;
}) {
  const bg = isHighlighted
    ? "#10b981"
    : member.gender === "L"
    ? "#3b82f6"
    : member.gender === "P"
    ? "#f43f5e"
    : "#71717a";

  const borderColor = isHighlighted
    ? "#059669"
    : member.gender === "L"
    ? "#2563eb"
    : member.gender === "P"
    ? "#e11d48"
    : "#52525b";

  const [line1, line2] = fitName(member.name);
  const hasDate = !!member.birthDate;
  const LINE_H = 16;
  const nameLines = line2 ? 2 : 1;
  const contentH = nameLines * LINE_H + (hasDate ? 14 : 0);
  const baseY = y + (CARD_H - contentH) / 2 + 13;

  return (
    <a href={`/members/${member.id}`} style={{ cursor: "pointer" }}>
      <rect
        x={x} y={y} width={CARD_W} height={CARD_H} rx={8}
        fill={bg} stroke={borderColor} strokeWidth={2}
      />
      <text
        x={x + CARD_W / 2} y={baseY}
        textAnchor="middle" fontSize={13} fontWeight="800"
        fill="#ffffff" fontFamily="system-ui,-apple-system,sans-serif"
      >{line1}</text>
      {line2 && (
        <text
          x={x + CARD_W / 2} y={baseY + LINE_H}
          textAnchor="middle" fontSize={13} fontWeight="800"
          fill="#ffffff" fontFamily="system-ui,-apple-system,sans-serif"
        >{line2}</text>
      )}
      {hasDate && (
        <text
          x={x + CARD_W / 2} y={baseY + nameLines * LINE_H}
          textAnchor="middle" fontSize={11} fontWeight="600"
          fill="#ffffff" opacity={0.9} fontFamily="system-ui,-apple-system,sans-serif"
        >{member.birthDate}</text>
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
    <g
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ cursor: "pointer" }}
    >
      <circle
        cx={x} cy={y} r={TOGGLE_R}
        fill="white"
        stroke={hovered ? "#10b981" : "#d1d5db"}
        strokeWidth={1.5}
      />
      {/* horizontal bar (always shown) */}
      <line
        x1={x - 4.5} y1={y} x2={x + 4.5} y2={y}
        stroke={hovered ? "#10b981" : "#6b7280"}
        strokeWidth={1.5} strokeLinecap="round"
      />
      {/* vertical bar (only when collapsed = plus icon) */}
      {collapsed && (
        <line
          x1={x} y1={y - 4.5} x2={x} y2={y + 4.5}
          stroke={hovered ? "#10b981" : "#6b7280"}
          strokeWidth={1.5} strokeLinecap="round"
        />
      )}
    </g>
  );
}

// ─── SVG Renderer ─────────────────────────────────────────────────────────────

interface RenderCtx {
  highlightId?: string;
  collapsed: Set<string>;
  onToggle: (key: string) => void;
}

/**
 * Render a LayoutNode at absolute (ox, oy) offset.
 * Returns SVG elements.
 */
function renderNode(
  layout: LayoutNode,
  ox: number, // x offset of this node's block in SVG canvas
  oy: number, // y offset (top of couple row)
  ctx: RenderCtx,
): React.ReactNode[] {
  const els: React.ReactNode[] = [];
  const { node } = layout;

  // Find x of X card in SVG coords
  // anchorX is center of X card in node-local, so xCardLeft = anchorX - CARD_W/2
  const xCardLeft = ox + layout.anchorX - CARD_W / 2;
  const coupleRowY = oy;

  // Render X card
  els.push(
    <MemberCardSvg
      key={`card-${node.member.id}`}
      member={node.member}
      isHighlighted={node.member.id === ctx.highlightId}
      x={xCardLeft}
      y={coupleRowY}
    />
  );

  // Render each group
  for (const lg of layout.children) {
    const g = lg.group;
    const nodeKey = g.partner
      ? `${node.member.id}-${g.relationshipId ?? g.partner.id}`
      : `${node.member.id}-single`;

    // ── Partner card & connector ──
    if (g.partner) {
      const pX = ox + lg.partnerX;
      const cX = ox + lg.connectorX;
      const midY = coupleRowY + CARD_H / 2;

      // Connector horizontal line
      if (g.status === "former") {
        // Dashed line with X badge
        const midConnX = cX + CONN_W / 2;
        els.push(
          <line key={`conn-l-${nodeKey}`}
            x1={cX} y1={midY} x2={midConnX - 6} y2={midY}
            stroke={LINE_CLR} strokeWidth={2} />,
          <line key={`conn-r-${nodeKey}`}
            x1={midConnX + 6} y1={midY} x2={cX + CONN_W} y2={midY}
            stroke={LINE_CLR} strokeWidth={2} />,
          <circle key={`conn-c-${nodeKey}`}
            cx={midConnX} cy={midY} r={6}
            fill="white" stroke={LINE_CLR} strokeWidth={2} />,
          <line key={`conn-x1-${nodeKey}`}
            x1={midConnX - 2.5} y1={midY - 2.5}
            x2={midConnX + 2.5} y2={midY + 2.5}
            stroke="#9ca3af" strokeWidth={2} strokeLinecap="round" />,
          <line key={`conn-x2-${nodeKey}`}
            x1={midConnX + 2.5} y1={midY - 2.5}
            x2={midConnX - 2.5} y2={midY + 2.5}
            stroke="#9ca3af" strokeWidth={2} strokeLinecap="round" />,
        );
      } else {
        els.push(
          <line key={`conn-${nodeKey}`}
            x1={cX} y1={midY} x2={cX + CONN_W} y2={midY}
            stroke={LINE_CLR} strokeWidth={2} />
        );
      }

      els.push(
        <MemberCardSvg
          key={`card-${g.partner.id}`}
          member={g.partner}
          isHighlighted={g.partner.id === ctx.highlightId}
          x={pX}
          y={coupleRowY}
        />
      );

      // ── T-junction: vertical line from couple anchor ──
      if (lg.group.children.length > 0) {
        const anchorSVGX = ox + lg.coupleAnchorX;
        const isCollapsed = ctx.collapsed.has(nodeKey);

        // Vertical line from midpoint of connector downward
        const lineStartY = midY;
        const toggleY    = coupleRowY + CARD_H + V_STUB + TOGGLE_R;
        const lineEndY   = isCollapsed ? toggleY : toggleY + TOGGLE_R + V_STUB;

        els.push(
          <line key={`v-${nodeKey}`}
            x1={anchorSVGX} y1={lineStartY}
            x2={anchorSVGX} y2={lineEndY}
            stroke={LINE_CLR} strokeWidth={2} />,
          <ToggleSvg
            key={`toggle-${nodeKey}`}
            x={anchorSVGX}
            y={toggleY}
            collapsed={isCollapsed}
            onClick={() => ctx.onToggle(nodeKey)}
          />
        );

        if (!isCollapsed) {
          // H-bar across children
          const childrenY = coupleRowY + CARD_H + V_STUB + TOGGLE_R * 2 + V_STUB;
          const firstChild = lg.childrenLayout[0];
          const lastChild  = lg.childrenLayout[lg.childrenLayout.length - 1];
          const hLeft  = ox + firstChild.x + firstChild.anchorX;
          const hRight = ox + lastChild.x  + lastChild.anchorX;

          if (lg.childrenLayout.length > 1) {
            els.push(
              <line key={`hbar-${nodeKey}`}
                x1={hLeft} y1={childrenY}
                x2={hRight} y2={childrenY}
                stroke={LINE_CLR} strokeWidth={2} />
            );
          }

          // Vertical stubs to each child
          for (const cl of lg.childrenLayout) {
            const childAnchorSVG = ox + cl.x + cl.anchorX;
            els.push(
              <line key={`vstub-${nodeKey}-${cl.node.member.id}`}
                x1={childAnchorSVG} y1={childrenY}
                x2={childAnchorSVG} y2={childrenY + V_STUB}
                stroke={LINE_CLR} strokeWidth={2} />
            );
          }

          // Recurse into children
          for (const cl of lg.childrenLayout) {
            els.push(...renderNode(
              cl,
              ox + cl.x,
              childrenY + V_STUB,
              ctx,
            ));
          }
        }
      }
    } else {
      // Single-parent group — vertical from center of X card
      if (lg.group.children.length > 0) {
        const anchorSVGX = ox + lg.coupleAnchorX;
        const isCollapsed = ctx.collapsed.has(nodeKey);
        const midY = coupleRowY + CARD_H / 2;
        const toggleY = coupleRowY + CARD_H + V_STUB + TOGGLE_R;
        const lineEndY = isCollapsed ? toggleY : toggleY + TOGGLE_R + V_STUB;

        els.push(
          <line key={`v-${nodeKey}`}
            x1={anchorSVGX} y1={midY}
            x2={anchorSVGX} y2={lineEndY}
            stroke={LINE_CLR} strokeWidth={2} />,
          <ToggleSvg
            key={`toggle-${nodeKey}`}
            x={anchorSVGX} y={toggleY}
            collapsed={isCollapsed}
            onClick={() => ctx.onToggle(nodeKey)}
          />
        );

        if (!isCollapsed) {
          const childrenY = coupleRowY + CARD_H + V_STUB + TOGGLE_R * 2 + V_STUB;
          const firstChild = lg.childrenLayout[0];
          const lastChild  = lg.childrenLayout[lg.childrenLayout.length - 1];
          const hLeft  = ox + firstChild.x + firstChild.anchorX;
          const hRight = ox + lastChild.x  + lastChild.anchorX;

          if (lg.childrenLayout.length > 1) {
            els.push(
              <line key={`hbar-${nodeKey}`}
                x1={hLeft} y1={childrenY}
                x2={hRight} y2={childrenY}
                stroke={LINE_CLR} strokeWidth={2} />
            );
          }

          for (const cl of lg.childrenLayout) {
            const childAnchorSVG = ox + cl.x + cl.anchorX;
            els.push(
              <line key={`vstub-${nodeKey}-${cl.node.member.id}`}
                x1={childAnchorSVG} y1={childrenY}
                x2={childAnchorSVG} y2={childrenY + V_STUB}
                stroke={LINE_CLR} strokeWidth={2} />
            );
          }

          for (const cl of lg.childrenLayout) {
            els.push(...renderNode(cl, ox + cl.x, childrenY + V_STUB, ctx));
          }
        }
      }
    }
  }

  return els;
}

/**
 * Compute total SVG height needed for a layout node (recursively).
 */
function computeHeight(layout: LayoutNode, collapsed: Set<string>): number {
  let maxChildHeight = 0;

  for (const lg of layout.children) {
    const g = lg.group;
    const nodeKey = g.partner
      ? `${layout.node.member.id}-${g.relationshipId ?? g.partner.id}`
      : `${layout.node.member.id}-single`;

    if (lg.group.children.length === 0) continue;
    if (collapsed.has(nodeKey)) continue;

    const connectorHeight = CARD_H + V_STUB + TOGGLE_R * 2 + V_STUB;
    const childMaxH = Math.max(...lg.childrenLayout.map((cl) => computeHeight(cl, collapsed)));
    maxChildHeight = Math.max(maxChildHeight, connectorHeight + childMaxH);
  }

  return CARD_H + maxChildHeight;
}

// ─── Main Component ───────────────────────────────────────────────────────────

const PADDING = 32;

export default function TreeNodeSvg({
  node,
  highlightId,
}: {
  node: TNode;
  highlightId?: string;
}) {
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  const onToggle = useCallback((key: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  const layout = useMemo(() => layoutNode(node, collapsed), [node, collapsed]);

  const svgWidth  = layout.width + PADDING * 2;
  const svgHeight = computeHeight(layout, collapsed) + PADDING * 2;

  const ctx: RenderCtx = { highlightId, collapsed, onToggle };
  const elements = renderNode(layout, PADDING, PADDING, ctx);

  return (
    <svg
      width={svgWidth}
      height={svgHeight}
      viewBox={`0 0 ${svgWidth} ${svgHeight}`}
      style={{ overflow: "visible", display: "block" }}
    >
      {elements}
    </svg>
  );
}