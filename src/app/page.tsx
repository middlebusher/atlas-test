"use client";

import { useState, useCallback } from "react";
import { DashboardNav } from "@/components/dashboard-nav";
import { PrList } from "@/components/pr-list";
import { PrSequenceSunburst } from "@/components/pr-sequence-sunburst";
import { pullRequests } from "@/data/pull-requests";

export default function Home() {
  const [selectedPrId, setSelectedPrId] = useState<number | null>(null);
  const graphPr = pullRequests.find((pr) => pr.id === selectedPrId) ?? null;

  const handleListSelect = useCallback((id: number | null) => {
    setSelectedPrId(id);
  }, []);

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-bg">
      <DashboardNav />
      <main className="flex flex-1 overflow-hidden">
        {/* Left: Pull Requests */}
        <div className="w-[340px] shrink-0 overflow-hidden border-r border-border">
          <PrList selectedId={selectedPrId} onSelect={handleListSelect} />
        </div>

        {/* Right: PR Diagram */}
        <div className="flex-1 overflow-hidden">
          <PrSequenceSunburst pr={graphPr} />
        </div>
      </main>
    </div>
  );
}
