/* eslint-disable @next/next/no-img-element */
/**
 * components/Tree/TreeView.tsx
 * Renders the full family tree from a flat member list.
 */

"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { toPng } from "html-to-image";
import { jsPDF } from "jspdf";
import { buildTree, getAllRootCandidates } from "@/lib/tree";
import type { Member } from "@/lib/members";
import type { PartnerRelationship } from "@/lib/relationships";
import {
  Search,
  Maximize,
  Minimize,
  Download,
  Image as ImageIcon,
  FileText,
  X,
  Filter,
  Users,
  Loader2,
  AlignLeft,
  LayoutGrid,
} from "lucide-react";
import TreeNodeSvg from "./TreeNodeSvg";

interface TreeViewProps {
  members: Member[];
  relationships: PartnerRelationship[];
}

function getExportFileBaseName(mainRootId: string, rootName?: string) {
  const date = new Date().toISOString().slice(0, 10);
  const name = (rootName ?? "all")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  return `family-tree-${mainRootId === "all" ? "all" : name || "root"}-${date}`;
}

function getImageSize(dataUrl: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.width, height: img.height });
    img.onerror = () => reject(new Error("Failed to read image size."));
    img.src = dataUrl;
  });
}

export default function TreeView({ members, relationships }: TreeViewProps) {
  const [search, setSearch] = useState("");
  const[fullscreen, setFullscreen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const[isPreparingPreview, setIsPreparingPreview] = useState(false);

  const treeContentRef = useRef<HTMLDivElement | null>(null);
  const restoredRef = useRef(false);

  const rootOptions = useMemo(
    () => getAllRootCandidates(members),
    [members]
  );

  // Default root: stored preference → member named "Wiryo" → "all"
  const defaultRootId = useMemo(() => {
    const wiryo = rootOptions.find(
      (r) => r.name.trim().toLowerCase() === "wiryo"
    );
    return wiryo?.id ?? "all";
  }, [rootOptions]);

  const [mainRootId, setMainRootId] = useState("all");
  const [orientation, setOrientation] = useState<"vertical" | "horizontal">("vertical");

  useEffect(() => {
    if (restoredRef.current) return;
    restoredRef.current = true;
    const stored = localStorage.getItem("wiryo-main-root");
    if (stored && (stored === "all" || rootOptions.some((r) => r.id === stored))) {
      setMainRootId(stored);
    } else {
      setMainRootId(defaultRootId);
    }
    const storedOrientation = localStorage.getItem("wiryo-orientation");
    if (storedOrientation === "horizontal" || storedOrientation === "vertical") {
      setOrientation(storedOrientation);
    }
  }, [rootOptions, defaultRootId]);

  useEffect(() => {
    document.body.style.overflow = fullscreen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [fullscreen]);

  const forest = useMemo(
    () =>
      buildTree(members, relationships, {
        mainRootId: mainRootId === "all" ? undefined : mainRootId,
      }),[members, relationships, mainRootId]
  );

  const highlightId = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return undefined;
    const found = members.find((m) => m.name.toLowerCase().includes(q));
    return found?.id;
  }, [search, members]);

  async function captureTreeImage(): Promise<string> {
    const node = treeContentRef.current;
    if (!node) throw new Error("Tree container not found.");

    const width = Math.max(node.scrollWidth, node.clientWidth);
    const height = Math.max(node.scrollHeight, node.clientHeight);

    // TreeNodeSvg already uses hardcoded light-mode inline styles — no class
    // overrides needed. Just capture the SVG tree directly.
    return await toPng(node, {
      cacheBust: true,
      pixelRatio: 2,
      backgroundColor: "#ffffff",
      width,
      height,
      style: { width: `${width}px`, height: `${height}px` },
    });
  }

  async function handleOpenPreview() {
    setIsPreparingPreview(true);
    try {
      const image = await captureTreeImage();
      setPreviewImage(image);
      setPreviewOpen(true);
    } catch {
      alert("Gagal membuat preview export.");
    } finally {
      setIsPreparingPreview(false);
    }
  }

  function handleDownloadPng() {
    if (!previewImage) return;
    const rootName = rootOptions.find((r) => r.id === mainRootId)?.name;
    const fileBaseName = getExportFileBaseName(mainRootId, rootName);

    const link = document.createElement("a");
    link.href = previewImage;
    link.download = `${fileBaseName}.png`;
    link.click();
  }

  async function handleDownloadPdf() {
    if (!previewImage) return;
    try {
      const { width: imgW, height: imgH } = await getImageSize(previewImage);

      // A1 landscape in points (1 mm = 2.8346 pt): 841 × 594 mm
      const PAGE_W = 2383.94;
      const PAGE_H = 1683.78;

      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "pt",
        format: "a1",
      });

      const scale = Math.min(PAGE_W / imgW, PAGE_H / imgH);
      const drawW = imgW * scale;
      const drawH = imgH * scale;
      const offsetX = (PAGE_W - drawW) / 2;
      const offsetY = (PAGE_H - drawH) / 2;

      pdf.addImage(previewImage, "PNG", offsetX, offsetY, drawW, drawH);

      const rootName = rootOptions.find((r) => r.id === mainRootId)?.name;
      const fileBaseName = getExportFileBaseName(mainRootId, rootName);
      pdf.save(`${fileBaseName}.pdf`);
    } catch {
      alert("Gagal export PDF.");
    }
  }

  if (members.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-zinc-200 bg-transparent py-16 text-center dark:border-zinc-800">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800/50">
          <Users className="h-7 w-7 text-zinc-400 dark:text-zinc-500" />
        </div>
        <p className="text-zinc-500 dark:text-zinc-400">
          No members yet. Add the first person to start your tree!
        </p>
      </div>
    );
  }

  const controlsBar = (
    <div
      className={
        fullscreen
          ? "shrink-0 flex flex-col gap-4 border-b border-zinc-200 bg-white/95 px-6 py-4 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-950/95 md:flex-row md:items-center md:justify-between"
          : "mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between"
      }
    >
      {/* Left: View Options */}
      <div className="flex items-center gap-3">
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400 dark:text-zinc-500" />
          <select
            value={mainRootId}
            onChange={(e) => {
              setMainRootId(e.target.value);
              localStorage.setItem("wiryo-main-root", e.target.value);
            }}
            className="h-10 w-full appearance-none rounded-xl border border-zinc-200 bg-zinc-50 pl-9 pr-10 text-sm font-medium text-zinc-700 shadow-sm transition focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 md:min-w-50"
          >
            <option value="all">View All Trees</option>
            {rootOptions.map((root) => (
              <option key={root.id} value={root.id}>
                Main: {root.name} {root.birthDate ? `(${root.birthDate})` : ""}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Search */}
        <div className="relative w-full sm:w-auto">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name..."
            className="h-10 w-full rounded-xl border border-zinc-200 bg-zinc-50 pl-9 pr-4 text-sm text-zinc-900 shadow-sm transition placeholder:text-zinc-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 sm:w-64"
          />
          {search && !highlightId && (
            <p className="absolute -bottom-5 left-1 text-[10px] text-rose-500 dark:text-rose-400">
              Not found
            </p>
          )}
        </div>

        {/* Export Button */}
        <button
          type="button"
          onClick={handleOpenPreview}
          disabled={isPreparingPreview}
          className="flex h-10 items-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 text-sm font-medium text-zinc-700 shadow-sm transition hover:bg-zinc-50 hover:text-emerald-600 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-emerald-400"
        >
          {isPreparingPreview ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Download className="h-4 w-4" />
          )}
          <span>Export</span>
        </button>

        {/* Orientation Toggle */}
        <button
          type="button"
          onClick={() => {
            const next = orientation === "vertical" ? "horizontal" : "vertical";
            setOrientation(next);
            localStorage.setItem("wiryo-orientation", next);
          }}
          title={orientation === "vertical" ? "Switch to horizontal layout" : "Switch to vertical layout"}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-500 shadow-sm transition hover:bg-zinc-50 hover:text-emerald-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-emerald-400"
        >
          {orientation === "vertical" ? (
            <AlignLeft className="h-4 w-4" />
          ) : (
            <LayoutGrid className="h-4 w-4" />
          )}
        </button>

        {/* Fullscreen Toggle */}
        <button
          type="button"
          onClick={() => setFullscreen((v) => !v)}
          title={fullscreen ? "Exit fullscreen" : "Fullscreen"}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-500 shadow-sm transition hover:bg-zinc-50 hover:text-emerald-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-emerald-400"
        >
          {fullscreen ? (
            <Minimize className="h-4 w-4" />
          ) : (
            <Maximize className="h-4 w-4" />
          )}
        </button>
      </div>
    </div>
  );

  return (
    <div
      className={
        fullscreen
          ? "fixed inset-0 z-50 flex flex-col bg-zinc-50 dark:bg-zinc-950"
          : "relative"
      }
    >
      {controlsBar}

      <div
        className={
          fullscreen
            ? "flex-1 overflow-auto p-8"
            : "overflow-x-auto rounded-2xl bg-zinc-50/50 p-6 dark:bg-zinc-900/20"
        }
      >
        <div
          ref={treeContentRef}
          className="flex min-w-max flex-col items-center gap-16 pb-4"
        >
          {forest.map((root) => (
            <TreeNodeSvg
              key={root.member.id}
              node={root}
              highlightId={highlightId}
              orientation={orientation}
            />
          ))}
        </div>
      </div>

      {!fullscreen && (
        <div className="mt-4 flex items-center justify-between text-xs text-zinc-400 dark:text-zinc-500">
          <p>
            {members.length} member{members.length !== 1 ? "s" : ""}
          </p>
          <p>
            {forest.length} tree{forest.length !== 1 ? "s" : ""} ·{" "}
            {rootOptions.length} total root{rootOptions.length !== 1 ? "s" : ""}
          </p>
        </div>
      )}

      {/* Export Preview Modal */}
      {previewOpen && previewImage && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-zinc-100 px-6 py-4 dark:border-zinc-800">
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                Preview Export
              </h3>
              <button
                type="button"
                onClick={() => setPreviewOpen(false)}
                className="rounded-full p-2 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-300 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Image Area */}
            <div className="flex-1 overflow-auto bg-zinc-100/50 p-6 dark:bg-zinc-950/50">
              <div className="rounded-xl border border-zinc-200 bg-white p-2 shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
                <img
                  src={previewImage}
                  alt="Family tree preview"
                  className="mx-auto h-auto max-w-full rounded"
                />
              </div>
            </div>

            {/* Modal Footer (Actions) */}
            <div className="flex items-center justify-end gap-3 border-t border-zinc-100 px-6 py-4 dark:border-zinc-800 bg-white dark:bg-zinc-900">
              <button
                type="button"
                onClick={handleDownloadPng}
                className="flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-5 py-2.5 text-sm font-semibold text-zinc-700 shadow-sm transition hover:bg-zinc-50 hover:text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-zinc-50"
              >
                <ImageIcon className="h-4 w-4 text-emerald-500" />
                Download PNG
              </button>
              <button
                type="button"
                onClick={handleDownloadPdf}
                className="flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 dark:focus:ring-offset-zinc-900"
              >
                <FileText className="h-4 w-4" />
                Download PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}