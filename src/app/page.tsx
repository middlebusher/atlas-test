"use client";

import { useState, useCallback } from "react";
import { DashboardNav } from "@/components/dashboard-nav";
import { PrList } from "@/components/pr-list";
import { PrDiagram } from "@/components/pr-diagram";
import { pullRequests } from "@/data/pull-requests";

export default function Home() {
  // Which PR the graph is built around (only changes on left panel clicks)
  const [graphPrId, setGraphPrId] = useState<number | null>(null);
  // Which PR is highlighted in the left panel (changes on both list clicks and focus swaps)
  const [highlightedId, setHighlightedId] = useState<number | null>(null);

  const graphPr = pullRequests.find((pr) => pr.id === graphPrId) ?? null;

  // Clicking a PR in the left panel: rebuild graph AND highlight
  const handleListSelect = useCallback((id: number | null) => {
    setGraphPrId(id);
    setHighlightedId(id);
  }, []);

  // Focus-swapping in the diagram: only highlight, don't rebuild graph
  const handleDiagramFocus = useCallback((id: number) => {
    setHighlightedId(id);
  }, []);

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-bg">
      <DashboardNav />
      <main className="flex flex-1 overflow-hidden">
        {/* Left: Pull Requests */}
        <div className="w-[340px] shrink-0 overflow-hidden border-r border-border">
          <PrList selectedId={highlightedId} onSelect={handleListSelect} />
        </div>

        {/* Right: PR Diagram */}
        <div className="flex-1 overflow-hidden">
          <PrDiagram pr={graphPr} onSelectPr={handleDiagramFocus} />
        </div>
      </main>
    </div>
  );
}
