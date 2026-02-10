"use client";

import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import type { HierarchyRectangularNode } from "d3-hierarchy";
import { prReviewLayersData, type SunburstNode } from "@/data/pr-review-layers";

const width = 240;
const radius = width / 2;
const color = d3.scaleOrdinal(d3.schemeTableau10);

export function PrSunburst() {
  const svgRef = useRef<SVGSVGElement>(null);
  const [focus, setFocus] = useState<HierarchyRectangularNode<SunburstNode> | null>(null);
  const [hovered, setHovered] = useState<HierarchyRectangularNode<SunburstNode> | null>(null);
  const [root, setRoot] = useState<HierarchyRectangularNode<SunburstNode> | null>(null);

  useEffect(() => {
    const rootNode = d3.hierarchy(prReviewLayersData).sum((d) => d.value ?? 0) as HierarchyRectangularNode<SunburstNode>;
    setRoot(rootNode);
  }, []);

  useEffect(() => {
    if (!svgRef.current || !root) return;

    const currentFocus = focus ?? root;
    const partition = d3.partition<SunburstNode>().size([2 * Math.PI, radius]);

    partition(currentFocus);

    const arc = d3
      .arc<HierarchyRectangularNode<SunburstNode>>()
      .startAngle((d) => d.x0)
      .endAngle((d) => d.x1)
      .padAngle(2 / radius)
      .innerRadius((d) => d.y0)
      .outerRadius((d) => Math.min(d.y1, radius));

    const mousearc = d3
      .arc<HierarchyRectangularNode<SunburstNode>>()
      .startAngle((d) => d.x0)
      .endAngle((d) => d.x1)
      .padAngle(2 / radius)
      .innerRadius((d) => d.y0)
      .outerRadius(radius);

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    svg
      .attr("viewBox", `${-radius} ${-radius} ${width} ${width}`)
      .style("max-width", "100%")
      .style("font", "12px sans-serif");

    const label = svg
      .append("text")
      .attr("text-anchor", "middle")
      .attr("fill", "var(--text-secondary)")
      .style("visibility", "hidden");

    label
      .append("tspan")
      .attr("class", "percentage")
      .attr("x", 0)
      .attr("y", 0)
      .attr("dy", "-0.1em")
      .attr("font-size", "1.1em")
      .attr("font-weight", "600")
      .attr("fill", "var(--text-primary)")
      .text("");

    label
      .append("tspan")
      .attr("x", 0)
      .attr("y", 0)
      .attr("dy", "1.4em")
      .attr("font-size", "0.55em")
      .attr("fill", "var(--text-muted)")
      .text("of changes");

    const path = svg
      .append("g")
      .selectAll("path")
      .data(
        currentFocus.descendants().filter((d) => d.depth && d.x1 - d.x0 > 0.001)
      )
      .join("path")
      .attr("fill", (d) => color(d.data.name))
      .attr("fill-opacity", (d) => (d.children ? 0.85 : 0.7))
      .attr("stroke", "var(--bg)")
      .attr("stroke-width", 1)
      .attr("cursor", "pointer")
      .attr("d", arc)
      .style("transition", "fill-opacity 0.15s")
      .on("click", (event, d) => {
        event.stopPropagation();
        setFocus(d);
      });

    svg
      .append("g")
      .attr("fill", "none")
      .attr("pointer-events", "all")
      .on("mouseleave", () => {
        path.attr("fill-opacity", (d) => (d.children ? 0.85 : 0.7));
        label.style("visibility", "hidden");
        setHovered(null);
      })
      .selectAll("path")
      .data(
        currentFocus.descendants().filter((d) => d.depth && d.x1 - d.x0 > 0.001)
      )
      .join("path")
      .attr("d", mousearc)
      .on("mouseenter", (_, d) => {
        path.attr("fill-opacity", (node) => {
          const sequence = d.ancestors().reverse().slice(1);
          return sequence.indexOf(node) >= 0 ? 1 : 0.2;
        });
        const percentage = ((100 * (d.value ?? 0)) / (root.value ?? 1)).toFixed(
          1
        );
        label.style("visibility", null).select(".percentage").text(`${percentage}%`);
        setHovered(d);
      })
      .on("click", (event, d) => {
        event.stopPropagation();
        setFocus(d);
      });

    return () => {
      svg.selectAll("*").remove();
    };
  }, [root, focus]);

  const sequence = (focus ?? hovered)
    ? (focus ?? hovered)!.ancestors().reverse().slice(1)
    : [];
  const total = root?.value ?? 1;
  const currentValue = (focus ?? hovered)?.value ?? 0;
  const percentage = ((100 * currentValue) / total).toFixed(1);

  return (
    <div className="flex flex-col items-center gap-2">
      {/* Breadcrumb */}
      <nav
        className="flex min-h-6 flex-wrap items-center justify-center gap-0.5 text-[10px]"
        aria-label="Breadcrumb"
      >
        <button
          type="button"
          onClick={() => setFocus(null)}
          className="rounded-none px-1.5 py-0.5 text-text-secondary transition-colors hover:bg-bg-card hover:text-text-primary"
        >
          PR
        </button>
        {sequence.map((node) => (
          <span key={node.data.name} className="flex items-center gap-0.5">
            <span className="text-text-muted">/</span>
            <button
              type="button"
              onClick={() => setFocus(node)}
              className="rounded-none px-1.5 py-0.5 text-text-secondary transition-colors hover:bg-bg-card hover:text-text-primary"
            >
              {node.data.name}
            </button>
          </span>
        ))}
      </nav>

      {/* Sunburst */}
      <figure className="flex flex-col items-center">
        <svg
          ref={svgRef}
          className="overflow-visible"
          width={width}
          height={width}
          aria-label="PR review layers sunburst"
        />
        {(focus ?? hovered) && (
          <figcaption className="mt-1 text-center text-[10px] text-text-muted">
            {percentage}% of changes
            {(focus ?? hovered)!.children?.length
              ? " — click to zoom"
              : " in this file"}
          </figcaption>
        )}
      </figure>

      {/* Reset zoom */}
      {focus && (
        <button
          type="button"
          onClick={() => setFocus(null)}
          className="rounded-[var(--radius-sm)] border border-border bg-bg-card px-2 py-1 text-[10px] font-medium text-text-secondary transition-colors hover:bg-bg-card-hover hover:text-text-primary"
        >
          Reset view
        </button>
      )}
    </div>
  );
}
