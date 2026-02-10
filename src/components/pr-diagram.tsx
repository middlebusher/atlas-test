"use client";

import { useEffect, useRef, useMemo, useState, useCallback } from "react";
import * as d3 from "d3";
import type { PullRequest } from "@/data/pull-requests";
import { pullRequests as allPullRequests } from "@/data/pull-requests";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface GraphNode extends d3.SimulationNodeDatum {
  id: string;
  name: string;
  isFile: boolean;
  additions: number;
  deletions: number;
  depth: number;
  childCount: number;
  prId: number;
  isPrimary: boolean; // which PR originally "owns" this cluster in the graph
  isPrHub: boolean;
  prTitle?: string;
  prNumber?: number;
}

interface GraphLink extends d3.SimulationLinkDatum<GraphNode> {
  source: string;
  target: string;
  isRelationship?: boolean;
}

/* ------------------------------------------------------------------ */
/*  Find related PRs by shared directory paths                         */
/* ------------------------------------------------------------------ */

function getDirPaths(files: { path: string }[], depth: number): Set<string> {
  const dirs = new Set<string>();
  for (const f of files) {
    const parts = f.path.split("/");
    for (let d = 1; d <= Math.min(depth, parts.length - 1); d++) {
      dirs.add(parts.slice(0, d).join("/"));
    }
  }
  return dirs;
}

interface RelatedPr {
  pr: PullRequest;
  sharedDirs: string[];
}

function findRelatedPrs(primary: PullRequest): RelatedPr[] {
  const primaryDirs = getDirPaths(primary.files, 3);
  const related: RelatedPr[] = [];
  for (const other of allPullRequests) {
    if (other.id === primary.id || other.repo !== primary.repo) continue;
    const otherDirs = getDirPaths(other.files, 3);
    const shared: string[] = [];
    for (const d of primaryDirs) {
      if (otherDirs.has(d)) shared.push(d);
    }
    const deepShared = shared.filter((d) => d.split("/").length >= 2);
    if (deepShared.length > 0) related.push({ pr: other, sharedDirs: deepShared });
  }
  return related;
}

/* ------------------------------------------------------------------ */
/*  Build tree + graph from file paths                                 */
/* ------------------------------------------------------------------ */

interface TreeNode {
  name: string;
  path: string;
  additions: number;
  deletions: number;
  children: TreeNode[];
  isFile: boolean;
}

function buildTree(files: { path: string; additions: number; deletions: number }[]): TreeNode {
  const root: TreeNode = { name: "root", path: "", additions: 0, deletions: 0, children: [], isFile: false };
  for (const file of files) {
    const parts = file.path.split("/");
    let current = root;
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const isFile = i === parts.length - 1;
      const existing = current.children.find((c) => c.name === part);
      if (existing) {
        if (isFile) { existing.additions = file.additions; existing.deletions = file.deletions; existing.isFile = true; }
        current = existing;
      } else {
        const n: TreeNode = { name: part, path: parts.slice(0, i + 1).join("/"), additions: isFile ? file.additions : 0, deletions: isFile ? file.deletions : 0, children: [], isFile };
        current.children.push(n);
        current = n;
      }
    }
  }
  function rollUp(node: TreeNode): { add: number; del: number } {
    if (node.isFile) return { add: node.additions, del: node.deletions };
    let add = 0, del = 0;
    for (const c of node.children) { const t = rollUp(c); add += t.add; del += t.del; }
    node.additions = add; node.deletions = del;
    return { add, del };
  }
  rollUp(root);
  return root;
}

function flattenTree(
  tree: TreeNode, prId: number, isPrimary: boolean, prefix: string,
  depth = 0, parentId: string | null = null, nodes: GraphNode[] = [], links: GraphLink[] = []
) {
  const id = prefix + (tree.path || "root");
  nodes.push({ id, name: tree.name, isFile: tree.isFile, additions: tree.additions, deletions: tree.deletions, depth, childCount: tree.children.length, prId, isPrimary, isPrHub: false });
  if (parentId !== null) links.push({ source: parentId, target: id });
  for (const child of tree.children) flattenTree(child, prId, isPrimary, prefix, depth + 1, id, nodes, links);
  return { nodes, links };
}

function buildMultiPrGraph(primary: PullRequest, related: RelatedPr[]) {
  const nodes: GraphNode[] = [];
  const links: GraphLink[] = [];
  const primaryTree = buildTree(primary.files);
  flattenTree(primaryTree, primary.id, true, "", 0, null, nodes, links);
  for (const rel of related) {
    const prefix = `rel:${rel.pr.id}:`;
    const hubId = `${prefix}hub`;
    nodes.push({ id: hubId, name: `#${rel.pr.number}`, isFile: false, additions: rel.pr.additions, deletions: rel.pr.deletions, depth: 0, childCount: rel.pr.files.length, prId: rel.pr.id, isPrimary: false, isPrHub: true, prTitle: rel.pr.title, prNumber: rel.pr.number });
    const relTree = buildTree(rel.pr.files);
    flattenTree(relTree, rel.pr.id, false, prefix, 1, hubId, nodes, links);
    for (const sharedDir of rel.sharedDirs) {
      if (nodes.find((n) => n.id === sharedDir)) links.push({ source: sharedDir, target: hubId, isRelationship: true });
    }
  }
  return { nodes, links };
}

/* ------------------------------------------------------------------ */
/*  Mock diff generator                                                */
/* ------------------------------------------------------------------ */

function generateMockDiff(node: GraphNode): string[] {
  const ext = node.name.split(".").pop() ?? "";
  const lines: string[] = [];
  if (ext === "ts" || ext === "tsx") {
    if (node.name.includes("type")) {
      lines.push(`  export interface ${toPascal(node.name.replace(/\.\w+$/, ""))}Config {`, `+   enabled: boolean;`, `+   timeout: number;`, `    metadata: Record<string, unknown>;`, `-   legacy?: boolean;`, `+   version: "v1" | "v2";`, `  }`);
    } else if (node.name.includes("handler") || node.name.includes("processor")) {
      lines.push(`  export async function handle(ctx: Context) {`, `    const payload = await ctx.req.json();`, `-   const result = await process(payload);`, `+   const validated = schema.parse(payload);`, `+   const result = await process(validated, {`, `+     streaming: ctx.env.ENABLE_STREAMING,`, `+   });`, `-   return ctx.json(result);`, `+   return ctx.json(result.data);`, `  }`);
    } else if (node.name.includes("test")) {
      lines.push(`+ describe("${toPascal(node.name.replace(/\.\w+$/, ""))}", () => {`, `+   it("should process valid input", async () => {`, `+     const result = await handler(mockCtx);`, `+     expect(result.status).toBe(200);`, `+   });`, `+ });`);
    } else if (node.name.includes("stream") || node.name.includes("encoder")) {
      lines.push(`+ export class StreamEncoder {`, `+   private encoder = new TextEncoder();`, `+   encode(chunk: Uint8Array): string {`, `+     return \`data: \${btoa(String.fromCharCode(`, `+       ...chunk`, `+     ))}\\n\\n\`;`, `+   }`, `+ }`);
    } else if (node.name.includes("queue") || node.name.includes("lock")) {
      lines.push(`  export class ${toPascal(node.name.replace(/\.\w+$/, ""))} {`, `-   private attempts = 0;`, `+   private attempts = new Map<string, number>();`, `-   async acquire(): Promise<boolean> {`, `+   async acquire(key: string): Promise<boolean> {`, `+     const count = this.attempts.get(key) ?? 0;`, `      return true;`, `  }`);
    } else {
      lines.push(`  import { config } from "../config";`, `+ import { validateInput } from "../lib/validate";`, `  export function ${toCamel(node.name.replace(/\.\w+$/, ""))}() {`, `+   const opts = validateInput(config);`, `-   return process(config);`, `+   return process(opts);`, `  }`);
    }
  } else if (ext === "md") {
    lines.push(`  ## Overview`, `+ This guide covers deployment on Kubernetes.`, `+ ### Prerequisites`, `+ - kubectl v1.28+`, `- - Docker 20.10+`, `+ - Docker 24.0+`);
  } else if (ext === "json") {
    lines.push(`  {`, `-   "openai": "^5.1.0",`, `+   "openai": "^5.2.0",`, `  }`);
  } else {
    lines.push(`+ // New content in ${node.name}`, `+ export default {};`);
  }
  return lines;
}

function toPascal(s: string): string { return s.split(/[-_.]/).map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(""); }
function toCamel(s: string): string { const p = toPascal(s); return p.charAt(0).toLowerCase() + p.slice(1); }
function extToLang(ext: string): string {
  const map: Record<string, string> = { ts: "TypeScript", tsx: "TypeScript (JSX)", js: "JavaScript", css: "CSS", md: "Markdown", json: "JSON" };
  return map[ext] ?? ext.toUpperCase();
}

/* ------------------------------------------------------------------ */
/*  Detail Panel                                                       */
/* ------------------------------------------------------------------ */

function NodeDetailPanel({ node, focusedPr, allNodes, onClose }: {
  node: GraphNode;
  focusedPr: PullRequest;
  allNodes: GraphNode[];
  onClose: () => void;
}) {
  if (node.isPrHub) {
    const relPr = allPullRequests.find((p) => p.id === node.prId);
    if (!relPr) return null;
    return (
      <div className="flex h-full flex-col border-l border-border bg-bg-card">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div className="flex flex-col gap-0.5 overflow-hidden">
            <span className="truncate text-xs font-medium text-text-primary">{relPr.title}</span>
            <span className="font-mono text-[10px] text-text-muted">{relPr.repo}#{relPr.number}</span>
          </div>
          <button type="button" onClick={onClose} className="ml-3 shrink-0 p-1 text-text-muted transition-colors hover:text-text-primary">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" /></svg>
          </button>
        </div>
        <div className="border-b border-border px-4 py-3">
          <div className="flex items-center gap-3">
            <span className="font-mono text-[11px] text-[#3fb950]">+{relPr.additions}</span>
            <span className="font-mono text-[11px] text-[#e55353]">-{relPr.deletions}</span>
            <span className="text-[10px] text-text-muted">{relPr.files.length} files</span>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-3">
          <h3 className="mb-2 font-mono text-[10px] font-semibold uppercase tracking-[0.15em] text-text-muted">Changed Files</h3>
          <div className="flex flex-col gap-1">
            {relPr.files.map((f) => (
              <div key={f.path} className="flex items-center justify-between border border-border bg-bg px-3 py-1.5">
                <span className="truncate font-mono text-[11px] text-text-secondary">{f.path.split("/").pop()}</span>
                <div className="flex shrink-0 gap-2 pl-2">
                  <span className="font-mono text-[9px] text-[#3fb950]">+{f.additions}</span>
                  <span className="font-mono text-[9px] text-[#e55353]">-{f.deletions}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 flex flex-col gap-1 text-[11px]">
            <div className="flex justify-between"><span className="text-text-muted">Author</span><span className="text-text-secondary">{relPr.author}</span></div>
            <div className="flex justify-between"><span className="text-text-muted">Branch</span><span className="font-mono text-text-secondary">{relPr.branch}</span></div>
            <div className="flex justify-between"><span className="text-text-muted">Updated</span><span className="text-text-secondary">{relPr.updatedAt}</span></div>
            <div className="flex justify-between"><span className="text-text-muted">PR</span><a href={`https://github.com/${relPr.repo}/pull/${relPr.number}`} target="_blank" rel="noopener noreferrer" className="truncate pl-4 font-mono text-[#F04006] hover:underline">#{relPr.number} on GitHub</a></div>
          </div>
        </div>
      </div>
    );
  }

  const total = node.additions + node.deletions;
  const addPct = total > 0 ? Math.round((node.additions / total) * 100) : 0;
  const delPct = 100 - addPct;
  const nodePrefix = node.prId === focusedPr.id && node.isPrimary ? "" : `rel:${node.prId}:`;
  const childFiles = allNodes.filter((n) => n.isFile && n.prId === node.prId && n.id.startsWith(node.id === (nodePrefix + "root") ? nodePrefix : node.id + "/"));
  const childDirs = allNodes.filter((n) => !n.isFile && !n.isPrHub && n.prId === node.prId && n.id !== node.id && n.id.startsWith(node.id === (nodePrefix + "root") ? nodePrefix : node.id + "/"));
  const diffLines = node.isFile ? generateMockDiff(node) : [];
  const isRoot = node.name === "root";
  const displayPr = allPullRequests.find((p) => p.id === node.prId) ?? focusedPr;

  return (
    <div className="flex h-full flex-col border-l border-border bg-bg-card">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex flex-col gap-0.5 overflow-hidden">
          <span className="truncate font-mono text-xs font-medium text-text-primary">{isRoot ? displayPr.repo.split("/")[1] : node.name}</span>
          <span className="font-mono text-[10px] text-text-muted">{node.isFile ? "File" : "Directory"}</span>
        </div>
        <button type="button" onClick={onClose} className="ml-3 shrink-0 p-1 text-text-muted transition-colors hover:text-text-primary">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" /></svg>
        </button>
      </div>
      <div className="border-b border-border px-4 py-3">
        <div className="mb-2 flex items-center gap-3">
          <span className="font-mono text-[11px] text-[#3fb950]">+{node.additions}</span>
          <span className="font-mono text-[11px] text-[#e55353]">-{node.deletions}</span>
          <span className="text-[10px] text-text-muted">{total} total</span>
        </div>
        {total > 0 && (
          <div className="flex h-1.5 w-full overflow-hidden">
            <div className="bg-[#3fb950]" style={{ width: `${addPct}%` }} />
            <div className="bg-[#e55353]" style={{ width: `${delPct}%` }} />
          </div>
        )}
      </div>
      <div className="flex-1 overflow-y-auto">
        {node.isFile ? (
          <div className="px-4 py-3">
            <h3 className="mb-2 font-mono text-[10px] font-semibold uppercase tracking-[0.15em] text-text-muted">Diff Preview</h3>
            <div className="border border-border bg-bg font-mono text-[11px] leading-relaxed">
              {diffLines.map((line, i) => {
                const trimmed = line.trimStart();
                const isAdd = trimmed.startsWith("+");
                const isDel = trimmed.startsWith("-");
                return (
                  <div key={i} className={`px-3 py-px ${isAdd ? "bg-[#3fb950]/8 text-[#3fb950]" : isDel ? "bg-[#e55353]/8 text-[#e55353]" : "text-text-secondary"}`}>
                    <span className="mr-3 inline-block w-3 select-none text-right text-text-muted/40">{isAdd ? "+" : isDel ? "-" : " "}</span>
                    {isAdd || isDel ? trimmed.slice(1).trimStart() : line}
                  </div>
                );
              })}
            </div>
            <div className="mt-4 flex flex-col gap-1 text-[11px]">
              <h3 className="mb-1 font-mono text-[10px] font-semibold uppercase tracking-[0.15em] text-text-muted">File Info</h3>
              <div className="flex justify-between"><span className="text-text-muted">Path</span><span className="truncate pl-4 font-mono text-text-secondary">{node.id.replace(/^rel:\d+:/, "")}</span></div>
              <div className="flex justify-between"><span className="text-text-muted">Language</span><span className="font-mono text-text-secondary">{extToLang(node.name.split(".").pop() ?? "")}</span></div>
              <div className="flex justify-between"><span className="text-text-muted">Net change</span><span className={`font-mono ${node.additions >= node.deletions ? "text-[#3fb950]" : "text-[#e55353]"}`}>{node.additions >= node.deletions ? "+" : ""}{node.additions - node.deletions} lines</span></div>
              <div className="flex justify-between"><span className="text-text-muted">PR</span><a href={`https://github.com/${displayPr.repo}/pull/${displayPr.number}`} target="_blank" rel="noopener noreferrer" className="truncate pl-4 font-mono text-[#F04006] hover:underline">#{displayPr.number}</a></div>
            </div>
          </div>
        ) : (
          <div className="px-4 py-3">
            {childDirs.length > 0 && (
              <div className="mb-4">
                <h3 className="mb-2 font-mono text-[10px] font-semibold uppercase tracking-[0.15em] text-text-muted">Subdirectories</h3>
                <div className="flex flex-col gap-1">
                  {childDirs.filter((d) => { const rest = d.id.slice(node.id.length + 1); return rest && !rest.includes("/"); }).map((d) => (
                    <div key={d.id} className="flex items-center justify-between border border-border bg-bg px-3 py-1.5">
                      <span className="font-mono text-[11px] text-text-secondary">{d.name}/</span>
                      <div className="flex gap-2"><span className="font-mono text-[9px] text-[#3fb950]">+{d.additions}</span><span className="font-mono text-[9px] text-[#e55353]">-{d.deletions}</span></div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <h3 className="mb-2 font-mono text-[10px] font-semibold uppercase tracking-[0.15em] text-text-muted">Changed Files</h3>
            <div className="flex flex-col gap-1">
              {childFiles.map((f) => (
                <div key={f.id} className="flex items-center justify-between border border-border bg-bg px-3 py-1.5">
                  <span className="truncate font-mono text-[11px] text-text-secondary">{f.name}</span>
                  <div className="flex shrink-0 gap-2 pl-2"><span className="font-mono text-[9px] text-[#3fb950]">+{f.additions}</span><span className="font-mono text-[9px] text-[#e55353]">-{f.deletions}</span></div>
                </div>
              ))}
            </div>
            <div className="mt-4 flex flex-col gap-1 text-[11px]">
              <h3 className="mb-1 font-mono text-[10px] font-semibold uppercase tracking-[0.15em] text-text-muted">Summary</h3>
              <div className="flex justify-between"><span className="text-text-muted">Files changed</span><span className="font-mono text-text-secondary">{childFiles.length}</span></div>
              <div className="flex justify-between"><span className="text-text-muted">Net change</span><span className={`font-mono ${node.additions >= node.deletions ? "text-[#3fb950]" : "text-[#e55353]"}`}>{node.additions >= node.deletions ? "+" : ""}{node.additions - node.deletions} lines</span></div>
              <div className="flex justify-between"><span className="text-text-muted">PR</span><a href={`https://github.com/${displayPr.repo}/pull/${displayPr.number}`} target="_blank" rel="noopener noreferrer" className="truncate pl-4 font-mono text-[#F04006] hover:underline">#{displayPr.number}</a></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Apply focus styling to d3 nodes                                    */
/* ------------------------------------------------------------------ */

function applyFocusStyling(
  nodeSelection: d3.Selection<SVGGElement, GraphNode, SVGGElement, unknown>,
  focusId: number,
  sizeScale: d3.ScalePower<number, number>,
  repoName: string,
  linkSelection?: d3.Selection<SVGLineElement, GraphLink, SVGGElement, unknown>,
) {
  // Update links based on focus
  if (linkSelection) {
    linkSelection.each(function (d) {
      const line = d3.select(this);
      const src = d.source as unknown as GraphNode;
      const tgt = d.target as unknown as GraphNode;
      const isFocused = src.prId === focusId && tgt.prId === focusId;
      if (d.isRelationship) {
        line.attr("stroke", "var(--text-secondary)").attr("stroke-opacity", 0.8);
      } else if (isFocused) {
        line.attr("stroke", "#FDFCFD").attr("stroke-opacity", 0.85);
      } else {
        line.attr("stroke", "#444444").attr("stroke-opacity", 0.35);
      }
    });
  }

  // Update all rects
  nodeSelection.each(function (d) {
    const g = d3.select(this);
    const isFocused = d.prId === focusId;

    if (d.isPrHub) {
      // Hub styling
      g.select("rect")
        .attr("stroke", isFocused ? "var(--text-primary)" : "var(--text-secondary)")
        .attr("stroke-width", isFocused ? 1.5 : 1)
        .attr("fill", isFocused ? "#2a2a2a" : "#1e1e1e");
      g.selectAll("text").attr("fill-opacity", isFocused ? 1 : 0.8);
    } else if (d.isFile) {
      const sz = sizeScale(d.additions + d.deletions);
      const total = d.additions + d.deletions;
      const ratio = total > 0 ? d.additions / total : 0;

      if (isFocused) {
        // Full size, bright color
        g.select("rect")
          .attr("width", sz * 2).attr("height", sz * 2)
          .attr("x", -sz).attr("y", -sz)
          .attr("fill", () => {
            if (total === 0) return "#333333";
            return ratio > 0.5 ? d3.interpolateRgb("#e5535340", "#3fb95040")((ratio - 0.5) * 2) : d3.interpolateRgb("#e5535340", "#e5535320")(ratio * 2);
          })
          .attr("fill-opacity", 1)
          .attr("stroke", () => {
            if (total === 0) return "#555555";
            return ratio > 0.5 ? d3.interpolateRgb("#e55353", "#3fb950")((ratio - 0.5) * 2) : "#e55353";
          })
          .attr("stroke-width", 1).attr("stroke-opacity", 0.6);
      } else {
        // Dimmed, smaller
        g.select("rect")
          .attr("width", sz * 1.4).attr("height", sz * 1.4)
          .attr("x", -sz * 0.7).attr("y", -sz * 0.7)
          .attr("fill", "#333333")
          .attr("fill-opacity", 0.5)
          .attr("stroke", "var(--text-secondary)")
          .attr("stroke-width", 1).attr("stroke-opacity", 0.45);
      }
    } else {
      // Directory node
      if (isFocused) {
        g.select("rect")
          .attr("width", 8).attr("height", 8).attr("x", -4).attr("y", -4)
          .attr("fill", d.name === "root" ? "var(--text-secondary)" : "#444444")
          .attr("fill-opacity", 1)
          .attr("stroke", "var(--text-secondary)").attr("stroke-width", 1).attr("stroke-opacity", 0.6);
      } else {
        g.select("rect")
          .attr("width", 6).attr("height", 6).attr("x", -3).attr("y", -3)
          .attr("fill", "#333333")
          .attr("fill-opacity", 0.6)
          .attr("stroke", "var(--text-secondary)").attr("stroke-width", 1).attr("stroke-opacity", 0.35);
      }
    }

    // Update labels
    if (!d.isPrHub) {
      const label = g.select<SVGTextElement>("text.node-label");
      const diffLabel = g.select<SVGTextElement>("text.diff-label");
      const sz = sizeScale(d.additions + d.deletions);

      if (isFocused) {
        label
          .text(d.name === "root" ? repoName : d.name)
          .attr("x", d.isFile ? sz + 6 : 10)
          .attr("font-size", d.name === "root" ? "12px" : "10px")
          .attr("fill", d.isFile ? "var(--text-primary)" : "var(--text-secondary)")
          .attr("fill-opacity", 1)
          .attr("font-weight", d.name === "root" ? "600" : "400");
        if (d.isFile) {
          diffLabel
            .attr("x", sz + 6)
            .attr("opacity", 1)
            .html(`<tspan fill="#3fb950">+${d.additions}</tspan> <tspan fill="#e55353">-${d.deletions}</tspan>`);
        }
      } else {
        label
          .text(d.name === "root" ? "" : d.name)
          .attr("x", d.isFile ? sz * 0.7 + 5 : 8)
          .attr("font-size", "9px")
          .attr("fill", "var(--text-secondary)")
          .attr("fill-opacity", 0.7)
          .attr("font-weight", "400");
        if (d.isFile) {
          diffLabel.attr("opacity", 0);
        }
      }
    }
  });
}

/* ------------------------------------------------------------------ */
/*  Main Component                                                     */
/* ------------------------------------------------------------------ */

export function PrDiagram({
  pr,
  onSelectPr,
}: {
  pr: PullRequest | null;
  onSelectPr?: (id: number) => void;
}) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [focusedPrId, setFocusedPrId] = useState<number | null>(null);

  // Store d3 refs for focus updates
  const nodeSelRef = useRef<d3.Selection<SVGGElement, GraphNode, SVGGElement, unknown> | null>(null);
  const linkSelRef = useRef<d3.Selection<SVGLineElement, GraphLink, SVGGElement, unknown> | null>(null);
  const sizeScaleRef = useRef<d3.ScalePower<number, number> | null>(null);

  // Reset when a new PR is selected from the left panel
  useEffect(() => {
    setSelectedNode(null);
    setFocusedPrId(pr?.id ?? null);
  }, [pr]);

  const related = useMemo(() => (pr ? findRelatedPrs(pr) : []), [pr]);

  const graph = useMemo(() => {
    if (!pr) return null;
    return buildMultiPrGraph(pr, related);
  }, [pr, related]);

  // Resolve the focused PR object
  const focusedPr = useMemo(() => {
    if (!focusedPrId) return pr;
    return allPullRequests.find((p) => p.id === focusedPrId) ?? pr;
  }, [focusedPrId, pr]);

  // Handle node click: swap focus or open detail panel
  const handleNodeClick = useCallback((node: GraphNode) => {
    if (node.prId !== focusedPrId) {
      // Swap focus to this PR's cluster — graph stays in place
      setFocusedPrId(node.prId);
      setSelectedNode(null);
      // Also update the left panel highlight (NOT the graph source)
      onSelectPr?.(node.prId);
      return;
    }
    // Same PR — toggle detail panel
    setSelectedNode((prev) => (prev?.id === node.id ? null : node));
  }, [focusedPrId, onSelectPr]);

  // Keep a stable ref so D3 click handlers always call the latest version
  const handleNodeClickRef = useRef(handleNodeClick);
  handleNodeClickRef.current = handleNodeClick;

  // Apply focus styling whenever focusedPrId changes (without rebuilding graph)
  useEffect(() => {
    if (!nodeSelRef.current || !sizeScaleRef.current || !focusedPrId || !focusedPr) return;
    applyFocusStyling(
      nodeSelRef.current,
      focusedPrId,
      sizeScaleRef.current,
      focusedPr.repo.split("/")[1],
      linkSelRef.current ?? undefined,
    );
  }, [focusedPrId, focusedPr]);

  // Build and render the d3 graph
  useEffect(() => {
    if (!svgRef.current || !containerRef.current || !graph || !pr) return;

    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();
    svg.attr("width", width).attr("height", height);

    const g = svg.append("g");

    const zoom = d3.zoom<SVGSVGElement, unknown>().scaleExtent([0.2, 4]).on("zoom", (event) => { g.attr("transform", event.transform); });
    svg.call(zoom);

    const maxChanges = Math.max(...graph.nodes.filter((n) => !n.isPrHub).map((n) => n.additions + n.deletions), 1);
    const sizeScale = d3.scaleSqrt().domain([0, maxChanges]).range([4, 28]);
    sizeScaleRef.current = sizeScale;

    const simulation = d3
      .forceSimulation<GraphNode>(graph.nodes)
      .force("link", d3.forceLink<GraphNode, GraphLink>(graph.links).id((d) => d.id).distance((d) => {
        const l = d as GraphLink;
        if (l.isRelationship) return 180;
        const target = d.target as unknown as GraphNode;
        if (target.isPrHub) return 120;
        return target.isFile ? 80 : 60;
      }))
      .force("charge", d3.forceManyBody().strength((d) => {
        const n = d as GraphNode;
        return n.isPrHub ? -400 : n.isPrimary ? -200 : -120;
      }))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collision", d3.forceCollide<GraphNode>().radius((d) => {
        if (d.isPrHub) return 30;
        return d.isFile ? sizeScale(d.additions + d.deletions) + 6 : 12;
      }));

    // Links
    const link = g.append("g").selectAll<SVGLineElement, GraphLink>("line").data(graph.links).join("line")
      .attr("stroke-width", (d) => d.isRelationship ? 1.5 : 1)
      .attr("stroke-dasharray", (d) => d.isRelationship ? "6,4" : "none");

    linkSelRef.current = link;

    // Nodes
    const node = g.append("g").selectAll<SVGGElement, GraphNode>("g").data(graph.nodes).join("g")
      .attr("cursor", "pointer")
      .on("click", (event, d) => { event.stopPropagation(); handleNodeClickRef.current(d); })
      .call(
        d3.drag<SVGGElement, GraphNode>()
          .on("start", (event, d) => { if (!event.active) simulation.alphaTarget(0.3).restart(); d.fx = d.x; d.fy = d.y; })
          .on("drag", (event, d) => { d.fx = event.x; d.fy = event.y; })
          .on("end", (event, d) => { if (!event.active) simulation.alphaTarget(0); d.fx = null; d.fy = null; })
      );

    nodeSelRef.current = node;

    // PR Hub nodes
    const hubs = node.filter((d) => d.isPrHub);
    hubs.append("rect").attr("width", 120).attr("height", 32).attr("x", -60).attr("y", -16)
      .attr("fill", "#1e1e1e").attr("stroke", "var(--text-secondary)").attr("stroke-width", 1).attr("stroke-dasharray", "4,3");
    hubs.append("text").text((d) => `PR #${d.prNumber}`).attr("class", "node-label")
      .attr("text-anchor", "middle").attr("y", -2).attr("font-size", "10px")
      .attr("font-family", "var(--font-mono), monospace").attr("font-weight", "600").attr("fill", "var(--text-primary)");
    hubs.append("text").text((d) => { const t = d.prTitle ?? ""; return t.length > 22 ? t.slice(0, 22) + "…" : t; })
      .attr("text-anchor", "middle").attr("y", 11).attr("font-size", "8px")
      .attr("font-family", "var(--font-mono), monospace").attr("fill", "var(--text-secondary)");

    // All file nodes get a rect (styling applied by applyFocusStyling)
    node.filter((d) => d.isFile).append("rect");

    // All directory (non-hub, non-file) nodes get a rect
    node.filter((d) => !d.isFile && !d.isPrHub).append("rect");

    // Labels for non-hub nodes
    node.filter((d) => !d.isPrHub).append("text").attr("class", "node-label").attr("y", 3)
      .attr("font-family", "var(--font-mono), monospace");

    // Diff stats labels for file nodes
    node.filter((d) => d.isFile).append("text").attr("class", "diff-label").attr("y", 14)
      .attr("font-size", "9px").attr("font-family", "var(--font-mono), monospace");

    // Apply initial focus styling
    const currentFocus = focusedPrId ?? pr.id;
    const currentFocusedPr = allPullRequests.find((p) => p.id === currentFocus) ?? pr;
    applyFocusStyling(node, currentFocus, sizeScale, currentFocusedPr.repo.split("/")[1], link);

    svg.on("click", () => { setSelectedNode(null); });

    simulation.on("tick", () => {
      link
        .attr("x1", (d) => (d.source as unknown as GraphNode).x!)
        .attr("y1", (d) => (d.source as unknown as GraphNode).y!)
        .attr("x2", (d) => (d.target as unknown as GraphNode).x!)
        .attr("y2", (d) => (d.target as unknown as GraphNode).y!);
      node.attr("transform", (d) => `translate(${d.x},${d.y})`);
    });

    svg.call(zoom.transform, d3.zoomIdentity);

    return () => { simulation.stop(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [graph, pr]);

  if (!pr) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-text-muted">Select a pull request</p>
          <p className="mt-2 text-xs text-text-muted">Click a PR on the left to visualize its file changes</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header — shows the FOCUSED PR, not necessarily the primary */}
      <div className="border-b border-border px-5 py-3.5">
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <h2 className="text-sm font-medium text-text-primary">{focusedPr?.title ?? pr.title}</h2>
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] text-text-muted">{focusedPr?.repo ?? pr.repo}#{focusedPr?.number ?? pr.number}</span>
              <span className="text-[10px] text-text-muted">·</span>
              <span className="text-[10px] text-text-muted">{focusedPr?.files.length ?? pr.files.length} files</span>
              <span className="text-[10px] text-text-muted">·</span>
              <span className="font-mono text-[10px] text-[#3fb950]">+{focusedPr?.additions ?? pr.additions}</span>
              <span className="font-mono text-[10px] text-[#e55353]">-{focusedPr?.deletions ?? pr.deletions}</span>
              {related.length > 0 && (
                <>
                  <span className="text-[10px] text-text-muted">·</span>
                  <span className="text-[10px] text-text-muted">{related.length} related PR{related.length > 1 ? "s" : ""}</span>
                </>
              )}
            </div>
          </div>
          <span className="shrink-0 font-mono text-[9px] uppercase tracking-wider text-text-muted">File Graph</span>
        </div>
        <p className="mt-2 text-[11px] leading-relaxed text-text-secondary">
          {focusedPr?.summary ?? pr.summary}
        </p>
      </div>

      {/* Diagram + detail panel */}
      <div className="flex flex-1 overflow-hidden">
        <div ref={containerRef} className="relative flex-1 overflow-hidden">
          <svg ref={svgRef} className="absolute inset-0" />
          <div className="absolute bottom-4 left-4 flex items-center gap-4 text-[9px] text-text-muted">
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-2.5 w-2.5 border border-text-muted/40 bg-border" />
              Directory
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-2.5 w-2.5 border border-[#3fb950]/60 bg-[#3fb95040]" />
              Additions
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-2.5 w-2.5 border border-[#e55353]/60 bg-[#e5535340]" />
              Deletions
            </span>
            {related.length > 0 && (
              <span className="flex items-center gap-1.5">
                <span className="inline-block h-2.5 w-4 border border-dashed border-text-muted/40 bg-bg-card" />
                Related PR
              </span>
            )}
            <span className="text-text-muted/50">Click a cluster to shift focus</span>
          </div>
        </div>

        {selectedNode && graph && (
          <div className="w-[320px] shrink-0">
            <NodeDetailPanel
              node={selectedNode}
              focusedPr={focusedPr ?? pr}
              allNodes={graph.nodes}
              onClose={() => setSelectedNode(null)}
            />
          </div>
        )}
      </div>
    </div>
  );
}
