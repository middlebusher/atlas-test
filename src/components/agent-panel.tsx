"use client";

import { useState } from "react";

export function AgentPanel() {
  const [prompt, setPrompt] = useState("");

  return (
    <div className="flex h-full flex-col rounded-[var(--radius-lg)] border border-border bg-bg-surface">
      {/* Title bar */}
      <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
        <h2 className="font-mono text-[10px] font-semibold uppercase tracking-[0.15em] text-text-muted">
          CodeRabbit.Agent
        </h2>
        <div className="flex items-center gap-1.5">
          <button type="button" className="h-3 w-3 rounded-none border border-text-muted/30 transition-colors hover:bg-text-muted/20" aria-label="Minimize" />
          <button type="button" className="h-3 w-3 rounded-none border border-text-muted/30 transition-colors hover:bg-text-muted/20" aria-label="Maximize" />
          <button type="button" className="h-3 w-3 rounded-none border border-text-muted/30 transition-colors hover:bg-red-500/40" aria-label="Close" />
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 p-4">
        {/* Empty state / placeholder */}
      </div>

      {/* Input */}
      <div className="border-t border-border p-3">
        <div className="flex items-center rounded-[var(--radius)] border border-border bg-bg-input px-3 py-2.5">
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Enter your prompt here, @ a tool for context"
            className="flex-1 bg-transparent text-xs text-text-primary placeholder:text-text-muted outline-none"
          />
        </div>
      </div>
    </div>
  );
}
