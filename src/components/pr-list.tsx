"use client";

import { useState } from "react";
import { pullRequests, type PullRequest } from "@/data/pull-requests";

const statusLabel: Record<PullRequest["status"], string> = {
  open: "Open",
  merged: "Merged",
  closed: "Closed",
  draft: "Draft",
};

const reviewLabel: Record<string, string> = {
  approved: "Approved",
  changes_requested: "Changes requested",
  pending: "Review pending",
  reviewed: "Reviewed",
};

type Filter = "all" | "open" | "merged" | "draft";

export function PrList({
  selectedId,
  onSelect,
}: {
  selectedId: number | null;
  onSelect: (id: number | null) => void;
}) {
  const [filter, setFilter] = useState<Filter>("all");

  const filtered = pullRequests.filter((pr) => {
    if (filter === "all") return true;
    return pr.status === filter;
  });

  const counts = {
    all: pullRequests.length,
    open: pullRequests.filter((p) => p.status === "open").length,
    merged: pullRequests.filter((p) => p.status === "merged").length,
    draft: pullRequests.filter((p) => p.status === "draft").length,
  };

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="px-4 pt-4 pb-2">
        <h2 className="font-mono text-[10px] font-semibold uppercase tracking-[0.15em] text-text-muted">
          Pull Requests
        </h2>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 border-b border-border px-4 pb-0">
        {(["all", "open", "merged", "draft"] as Filter[]).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={`relative px-2 py-1.5 text-[11px] capitalize transition-colors ${
              filter === f
                ? "text-text-primary"
                : "text-text-muted hover:text-text-secondary"
            }`}
          >
            {f}
            <span className="ml-1 text-[10px] text-text-muted">{counts[f]}</span>
            {filter === f && (
              <span className="absolute bottom-0 left-0 right-0 h-px bg-text-primary" />
            )}
          </button>
        ))}
      </div>

      {/* PR list */}
      <div className="flex flex-1 flex-col gap-2 overflow-y-auto p-3">
        {filtered.map((pr) => (
          <button
            key={pr.id}
            type="button"
            onClick={() => onSelect(selectedId === pr.id ? null : pr.id)}
            className={`group flex w-full flex-col gap-1.5 border border-border bg-bg-card p-3 text-left transition-colors hover:bg-bg-card-hover ${
              selectedId === pr.id ? "border-text-muted" : ""
            }`}
          >
            {/* Title */}
            <span className="text-xs font-medium leading-snug text-text-primary">
              {pr.title}
            </span>

            {/* Repo + number + branch */}
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] text-text-muted">
                {pr.repo}#{pr.number}
              </span>
              <span className="text-[10px] text-text-muted">·</span>
              <span className="text-[10px] text-text-muted">{pr.branch}</span>
            </div>

            {/* Bottom row: status, labels, stats, time */}
            <div className="flex items-center gap-1.5">
              {/* Status */}
              <span className="border border-border px-1.5 py-px text-[9px] font-medium text-text-secondary">
                {statusLabel[pr.status]}
              </span>

              {/* Labels */}
              {pr.labels.map((label) => (
                <span
                  key={label.name}
                  className="border border-border px-1.5 py-px text-[9px] font-medium text-text-muted"
                >
                  {label.name}
                </span>
              ))}

              {/* Review status */}
              {pr.reviewStatus && (
                <span className="text-[9px] text-text-muted">
                  · {reviewLabel[pr.reviewStatus]}
                </span>
              )}

              <span className="flex-1" />

              {/* Diff stats */}
              <span className="font-mono text-[9px] text-[#3fb950]">+{pr.additions}</span>
              <span className="font-mono text-[9px] text-[#e55353]">-{pr.deletions}</span>

              {/* Comments */}
              {pr.comments > 0 && (
                <span className="flex items-center gap-0.5 text-[9px] text-text-muted">
                  <svg width="10" height="10" viewBox="0 0 16 16" fill="none">
                    <path
                      d="M2.5 3h11a1 1 0 011 1v7a1 1 0 01-1 1h-3l-3 2.5L4.5 12h-2a1 1 0 01-1-1V4a1 1 0 011-1z"
                      stroke="currentColor"
                      strokeWidth="1.2"
                    />
                  </svg>
                  {pr.comments}
                </span>
              )}

              {/* Time */}
              <span className="text-[9px] text-text-muted">{pr.updatedAt}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
