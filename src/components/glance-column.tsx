import { PrSunburst } from "@/components/pr-sunburst";

export function GlanceColumn() {
  return (
    <div className="flex flex-col gap-4">
      <section>
        <h2 className="mb-3 font-mono text-[10px] font-semibold uppercase tracking-[0.15em] text-text-muted">
          At a Glance
        </h2>

        {/* Sunburst */}
        <div className="mb-4 rounded-[var(--radius)] border border-border bg-bg-card p-3">
          <PrSunburst />
        </div>

        {/* Placeholder items */}
        <div className="flex flex-col gap-2">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-10 rounded-[var(--radius)] border border-border bg-bg-card transition-colors hover:bg-bg-card-hover"
            />
          ))}
        </div>
      </section>
    </div>
  );
}
