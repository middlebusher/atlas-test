"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import * as d3 from "d3";
import type { HierarchyRectangularNode } from "d3-hierarchy";
import type { PullRequest } from "@/data/pull-requests";
import { buildHierarchy, type SeqNode } from "@/utils/build-hierarchy";

/* ------------------------------------------------------------------ */
/*  Detail panel helpers (from pr-diagram)                             */
/* ------------------------------------------------------------------ */

function toPascal(s: string): string {
  return s
    .split(/[-_.]/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join("");
}
function toCamel(s: string): string {
  const p = toPascal(s);
  return p.charAt(0).toLowerCase() + p.slice(1);
}
function extToLang(ext: string): string {
  const map: Record<string, string> = {
    ts: "TypeScript",
    tsx: "TypeScript (JSX)",
    js: "JavaScript",
    css: "CSS",
    md: "Markdown",
    json: "JSON",
  };
  return map[ext] ?? ext.toUpperCase();
}

function generateMockDiff(
  name: string,
  additions: number,
  _deletions: number
): string[] {
  const ext = name.split(".").pop() ?? "";
  const lines: string[] = [];
  if (ext === "ts" || ext === "tsx") {
    if (name.includes("type")) {
      lines.push(
        `  export interface ${toPascal(name.replace(/\.\w+$/, ""))}Config {`,
        `+   enabled: boolean;`,
        `+   timeout: number;`,
        `    metadata: Record<string, unknown>;`,
        `-   legacy?: boolean;`,
        `+   version: "v1" | "v2";`,
        `  }`
      );
    } else if (name.includes("handler") || name.includes("processor")) {
      lines.push(
        `  export async function handle(ctx: Context) {`,
        `    const payload = await ctx.req.json();`,
        `-   const result = await process(payload);`,
        `+   const validated = schema.parse(payload);`,
        `+   const result = await process(validated, {`,
        `+     streaming: ctx.env.ENABLE_STREAMING,`,
        `+   });`,
        `-   return ctx.json(result);`,
        `+   return ctx.json(result.data);`,
        `  }`
      );
    } else if (name.includes("test")) {
      lines.push(
        `+ describe("${toPascal(name.replace(/\.\w+$/, ""))}", () => {`,
        `+   it("should process valid input", async () => {`,
        `+     const result = await handler(mockCtx);`,
        `+     expect(result.status).toBe(200);`,
        `+   });`,
        `+ });`
      );
    } else if (name.includes("stream") || name.includes("encoder")) {
      lines.push(
        `+ export class StreamEncoder {`,
        `+   private encoder = new TextEncoder();`,
        `+   encode(chunk: Uint8Array): string {`,
        `+     return \`data: \${btoa(String.fromCharCode(`,
        `+       ...chunk`,
        `+     ))}\\n\\n\`;`,
        `+   }`,
        `+ }`
      );
    } else if (name.includes("queue") || name.includes("lock")) {
      lines.push(
        `  export class ${toPascal(name.replace(/\.\w+$/, ""))} {`,
        `-   private attempts = 0;`,
        `+   private attempts = new Map<string, number>();`,
        `-   async acquire(): Promise<boolean> {`,
        `+   async acquire(key: string): Promise<boolean> {`,
        `+     const count = this.attempts.get(key) ?? 0;`,
        `      return true;`,
        `  }`
      );
    } else {
      lines.push(
        `  import { config } from "../config";`,
        `+ import { validateInput } from "../lib/validate";`,
        `  export function ${toCamel(name.replace(/\.\w+$/, ""))}() {`,
        `+   const opts = validateInput(config);`,
        `-   return process(config);`,
        `+   return process(opts);`,
        `  }`
      );
    }
  } else if (ext === "md") {
    lines.push(
      `  ## Overview`,
      `+ This guide covers deployment on Kubernetes.`,
      `+ ### Prerequisites`,
      `+ - kubectl v1.28+`,
      `- - Docker 20.10+`,
      `+ - Docker 24.0+`
    );
  } else if (ext === "json") {
    lines.push(`  {`, `-   "openai": "^5.1.0",`, `+   "openai": "^5.2.0",`, `  }`);
  } else {
    lines.push(`+ // New content in ${name}`, `+ export default {};`);
  }
  return lines;
}

/* ------------------------------------------------------------------ */
/*  Detail Panel                                                       */
/* ------------------------------------------------------------------ */

function FileDetailPanel({
  node,
  pr,
  onClose,
}: {
  node: HierarchyRectangularNode<SeqNode>;
  pr: PullRequest;
  onClose: () => void;
}) {
  const d = node.data;
  const isFile = d.path != null;
  const leafAdditions = d.additions ?? 0;
  const leafDeletions = d.deletions ?? 0;
  const diffLines = isFile ? generateMockDiff(d.name, leafAdditions, leafDeletions) : [];

  const childFiles = useMemo(() => {
    if (isFile) return [];
    const files: { name: string; additions: number; deletions: number }[] = [];
    node.each((n) => {
      if (n.data.path != null) {
        files.push({
          name: n.data.name,
          additions: n.data.additions ?? 0,
          deletions: n.data.deletions ?? 0,
        });
      }
    });
    return files;
  }, [node, isFile]);

  const totalAdditions = isFile ? leafAdditions : childFiles.reduce((s, f) => s + f.additions, 0);
  const totalDeletions = isFile ? leafDeletions : childFiles.reduce((s, f) => s + f.deletions, 0);
  const total = totalAdditions + totalDeletions;
  const totalChange = totalAdditions - totalDeletions;
  const addPct = total > 0 ? Math.round((totalAdditions / total) * 100) : 0;
  const delPct = 100 - addPct;

  return (
    <div className="flex h-full flex-col border-l border-border bg-bg-card">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex flex-col gap-0.5 overflow-hidden">
          <span className="truncate font-mono text-xs font-medium text-text-primary">
            {d.name}
          </span>
          <span className="font-mono text-[10px] text-text-muted">
            {isFile ? "File" : "Directory"}
          </span>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="ml-3 shrink-0 p-1 text-text-muted transition-colors hover:text-text-primary"
        >
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
            <path
              d="M4 4l8 8M12 4l-8 8"
              stroke="currentColor"
              strokeWidth="1.5"
            />
          </svg>
        </button>
      </div>
      <div className="border-b border-border px-4 py-3">
        <div className="mb-2 flex items-center gap-3">
          <span className="font-mono text-[11px] text-[#3fb950]">
            +{totalAdditions}
          </span>
          <span className="font-mono text-[11px] text-[#e55353]">
            -{totalDeletions}
          </span>
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
        {isFile ? (
          <div className="px-4 py-3">
            <h3 className="mb-2 font-mono text-[10px] font-semibold uppercase tracking-[0.15em] text-text-muted">
              Diff Preview
            </h3>
            <div className="border border-border bg-bg font-mono text-[11px] leading-relaxed">
              {diffLines.map((line, i) => {
                const trimmed = line.trimStart();
                const isAdd = trimmed.startsWith("+");
                const isDel = trimmed.startsWith("-");
                return (
                  <div
                    key={i}
                    className={`px-3 py-px ${isAdd ? "bg-[#3fb950]/8 text-[#3fb950]" : isDel ? "bg-[#e55353]/8 text-[#e55353]" : "text-text-secondary"}`}
                  >
                    <span className="mr-3 inline-block w-3 select-none text-right text-text-muted/40">
                      {isAdd ? "+" : isDel ? "-" : " "}
                    </span>
                    {isAdd || isDel ? trimmed.slice(1).trimStart() : line}
                  </div>
                );
              })}
            </div>
            <div className="mt-4 flex flex-col gap-1 text-[11px]">
              <h3 className="mb-1 font-mono text-[10px] font-semibold uppercase tracking-[0.15em] text-text-muted">
                File Info
              </h3>
              <div className="flex justify-between">
                <span className="text-text-muted">Path</span>
                <span className="truncate pl-4 font-mono text-text-secondary">
                  {d.path}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">Language</span>
                <span className="font-mono text-text-secondary">
                  {extToLang(d.name.split(".").pop() ?? "")}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">Net change</span>
                <span
                  className={`font-mono ${totalChange >= 0 ? "text-[#3fb950]" : "text-[#e55353]"}`}
                >
                  {totalChange >= 0 ? "+" : ""}
                  {totalChange} lines
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">PR</span>
                <a
                  href={`https://github.com/${pr.repo}/pull/${pr.number}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="truncate pl-4 font-mono text-[#F04006] hover:underline"
                >
                  #{pr.number}
                </a>
              </div>
            </div>
          </div>
        ) : (
          <div className="px-4 py-3">
            <h3 className="mb-2 font-mono text-[10px] font-semibold uppercase tracking-[0.15em] text-text-muted">
              Changed Files
            </h3>
            <div className="flex flex-col gap-1">
              {childFiles.map((f) => (
                <div
                  key={f.name}
                  className="flex items-center justify-between border border-border bg-bg px-3 py-1.5"
                >
                  <span className="truncate font-mono text-[11px] text-text-secondary">
                    {f.name}
                  </span>
                  <div className="flex shrink-0 gap-2 pl-2">
                    <span className="font-mono text-[9px] text-[#3fb950]">
                      +{f.additions}
                    </span>
                    <span className="font-mono text-[9px] text-[#e55353]">
                      -{f.deletions}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 flex flex-col gap-1 text-[11px]">
              <h3 className="mb-1 font-mono text-[10px] font-semibold uppercase tracking-[0.15em] text-text-muted">
                Summary
              </h3>
              <div className="flex justify-between">
                <span className="text-text-muted">Files changed</span>
                <span className="font-mono text-text-secondary">
                  {childFiles.length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">Net change</span>
                <span
                  className={`font-mono ${totalChange >= 0 ? "text-[#3fb950]" : "text-[#e55353]"}`}
                >
                  {totalChange >= 0 ? "+" : ""}
                  {totalChange} lines
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Rect fill color by add/del ratio                                   */
/* ------------------------------------------------------------------ */

function rectFill(d: HierarchyRectangularNode<SeqNode>): string {
  const data = d.data;
  const add = data.additions ?? 0;
  const del = data.deletions ?? 0;
  const total = add + del;

  if (total === 0) return "#444444";
  const ratio = add / total;
  if (ratio > 0.5) {
    return d3.interpolateRgb("#e55353", "#3fb950")((ratio - 0.5) * 2);
  }
  return d3.interpolateRgb("#e5535340", "#e55353")(ratio * 2);
}

/* ------------------------------------------------------------------ */
/*  Main Component                                                     */
/* ------------------------------------------------------------------ */

const WIDTH = 560;
const HEIGHT = 400;
const PADDING = 2;

export function PrSequenceIcicle({ pr }: { pr: PullRequest | null }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [focus, setFocus] = useState<HierarchyRectangularNode<SeqNode> | null>(
    null
  );
  const [hovered, setHovered] =
    useState<HierarchyRectangularNode<SeqNode> | null>(null);
  const [selectedNode, setSelectedNode] =
    useState<HierarchyRectangularNode<SeqNode> | null>(null);

  const hierarchy = useMemo(() => {
    if (!pr) return null;
    const root = buildHierarchy(pr.files);
    return d3.hierarchy(root).sum((d) => d.value ?? 0);
  }, [pr]);

  const sortedHierarchy = useMemo(() => {
    if (!hierarchy) return null;
    return hierarchy.sort((a, b) => (b.value ?? 0) - (a.value ?? 0));
  }, [hierarchy]);

  const partitionRoot = useMemo(() => {
    if (!sortedHierarchy) return null;
    const partition = d3
      .partition<SeqNode>()
      .size([WIDTH, HEIGHT])
      .padding(PADDING);
    const root = focus ?? sortedHierarchy;
    return partition(root) as HierarchyRectangularNode<SeqNode>;
  }, [sortedHierarchy, focus]);

  useEffect(() => {
    if (!svgRef.current || !partitionRoot) return;

    const currentFocus = focus ?? partitionRoot;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    svg
      .attr("viewBox", `0 0 ${WIDTH} ${HEIGHT}`)
      .style("max-width", "100%")
      .style("font", "12px sans-serif");

    const label = svg
      .append("text")
      .attr("text-anchor", "middle")
      .attr("x", WIDTH / 2)
      .attr("y", HEIGHT / 2)
      .attr("fill", "var(--text-secondary)")
      .style("visibility", "hidden");

    label
      .append("tspan")
      .attr("class", "percentage")
      .attr("x", WIDTH / 2)
      .attr("y", HEIGHT / 2)
      .attr("dy", "-0.3em")
      .attr("font-size", "1.2em")
      .attr("font-weight", "600")
      .attr("fill", "var(--text-primary)")
      .text("");

    label
      .append("tspan")
      .attr("x", WIDTH / 2)
      .attr("y", HEIGHT / 2)
      .attr("dy", "1.2em")
      .attr("font-size", "0.6em")
      .attr("fill", "var(--text-muted)")
      .text("of changes");

    const rect = svg
      .append("g")
      .selectAll("rect")
      .data(
        currentFocus
          .descendants()
          .filter((d) => d.depth && d.x1 - d.x0 > 0.5 && d.y1 - d.y0 > 0.5)
      )
      .join("rect")
      .attr("x", (d) => d.x0 + 1)
      .attr("y", (d) => d.y0 + 1)
      .attr("width", (d) => Math.max(0, d.x1 - d.x0 - 2))
      .attr("height", (d) => Math.max(0, d.y1 - d.y0 - 2))
      .attr("fill", (d) => rectFill(d))
      .attr("fill-opacity", (d) => (d.children ? 0.85 : 0.7))
      .attr("stroke", "var(--bg)")
      .attr("stroke-width", 1)
      .attr("cursor", "pointer")
      .style("transition", "fill-opacity 0.15s")
      .on("click", (event, d) => {
        event.stopPropagation();
        setFocus(d);
        setSelectedNode(d);
      });

    svg
      .append("g")
      .attr("fill", "none")
      .attr("pointer-events", "all")
      .on("mouseleave", () => {
        rect.attr("fill-opacity", (d) => (d.children ? 0.85 : 0.7));
        label.style("visibility", "hidden");
        setHovered(null);
      })
      .selectAll("rect")
      .data(
        currentFocus
          .descendants()
          .filter((d) => d.depth && d.x1 - d.x0 > 0.5 && d.y1 - d.y0 > 0.5)
      )
      .join("rect")
      .attr("x", (d) => d.x0)
      .attr("y", (d) => d.y0)
      .attr("width", (d) => d.x1 - d.x0)
      .attr("height", (d) => d.y1 - d.y0)
      .on("mouseenter", (_, d) => {
        const sequence = d.ancestors().reverse().slice(1);
        rect.attr("fill-opacity", (node) =>
          sequence.indexOf(node) >= 0 ? 1 : 0.2
        );
        const total = partitionRoot.value ?? 1;
        const percentage = ((100 * (d.value ?? 0)) / total).toFixed(1);
        label.style("visibility", null).select(".percentage").text(`${percentage}%`);
        setHovered(d);
      })
      .on("click", (event, d) => {
        event.stopPropagation();
        setFocus(d);
        setSelectedNode(d);
      });

    return () => {
      svg.selectAll("*").remove();
    };
  }, [partitionRoot, focus]);

  const sequence = (focus ?? hovered)
    ? (focus ?? hovered)!.ancestors().reverse().slice(1)
    : [];
  const total = partitionRoot?.value ?? 1;
  const currentValue = (focus ?? hovered)?.value ?? 0;
  const percentage = ((100 * currentValue) / total).toFixed(1);

  if (!pr) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-text-muted">
            Select a pull request
          </p>
          <p className="mt-2 text-xs text-text-muted">
            Click a PR on the left to visualize its file changes
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="border-b border-border px-5 py-3.5">
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <h2 className="text-sm font-medium text-text-primary">{pr.title}</h2>
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] text-text-muted">
                {pr.repo}#{pr.number}
              </span>
              <span className="text-[10px] text-text-muted">·</span>
              <span className="text-[10px] text-text-muted">
                {pr.files.length} files
              </span>
              <span className="text-[10px] text-text-muted">·</span>
              <span className="font-mono text-[10px] text-[#3fb950]">
                +{pr.additions}
              </span>
              <span className="font-mono text-[10px] text-[#e55353]">
                -{pr.deletions}
              </span>
            </div>
          </div>
          <span className="shrink-0 font-mono text-[9px] uppercase tracking-wider text-text-muted">
            Sequence Icicle
          </span>
        </div>
        <p className="mt-2 text-[11px] leading-relaxed text-text-secondary">
          {pr.summary}
        </p>
      </div>

      {/* Breadcrumb */}
      <nav
        className="flex min-h-6 flex-wrap items-center gap-0.5 border-b border-border px-5 py-2 text-[10px]"
        aria-label="Breadcrumb"
      >
        <button
          type="button"
          onClick={() => {
            setFocus(null);
            setSelectedNode(null);
          }}
          className="rounded-none px-1.5 py-0.5 text-text-secondary transition-colors hover:bg-bg-card hover:text-text-primary"
        >
          {pr.repo.split("/")[1]}
        </button>
        {sequence.map((node) => (
          <span key={node.data.name} className="flex items-center gap-0.5">
            <span className="text-text-muted">/</span>
            <button
              type="button"
              onClick={() => {
                setFocus(node);
                setSelectedNode(node);
              }}
              className="rounded-none px-1.5 py-0.5 text-text-secondary transition-colors hover:bg-bg-card hover:text-text-primary"
            >
              {node.data.name}
            </button>
          </span>
        ))}
      </nav>

      {/* Icicle + detail panel */}
      <div className="flex flex-1 overflow-hidden">
        <div
          ref={containerRef}
          className="flex flex-1 flex-col items-center justify-center overflow-hidden py-4"
        >
          <svg
            ref={svgRef}
            className="overflow-visible"
            width={WIDTH}
            height={HEIGHT}
            aria-label="PR file sequence icicle"
          />
          {(focus ?? hovered) && (
            <p className="mt-2 text-center text-[10px] text-text-muted">
              {percentage}% of changes
              {(focus ?? hovered)!.children?.length
                ? " — click to zoom"
                : " in this file"}
            </p>
          )}
          {focus && (
            <button
              type="button"
              onClick={() => {
                setFocus(null);
                setSelectedNode(null);
              }}
              className="mt-2 rounded-[var(--radius-sm)] border border-border bg-bg-card px-2 py-1 text-[10px] font-medium text-text-secondary transition-colors hover:bg-bg-card-hover hover:text-text-primary"
            >
              Reset view
            </button>
          )}
          <div className="mt-4 flex items-center gap-4 text-[9px] text-text-muted">
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-2.5 w-2.5 rounded-sm border border-[#3fb950]/60 bg-[#3fb95040]" />
              Additions
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-2.5 w-2.5 rounded-sm border border-[#e55353]/60 bg-[#e5535340]" />
              Deletions
            </span>
          </div>
        </div>

        {selectedNode && (
          <div className="w-[320px] shrink-0">
            <FileDetailPanel
              node={selectedNode}
              pr={pr}
              onClose={() => setSelectedNode(null)}
            />
          </div>
        )}
      </div>
    </div>
  );
}
