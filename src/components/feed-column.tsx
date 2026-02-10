export function FeedColumn() {
  return (
    <div className="flex flex-col gap-4">
      {/* Section: YOUR FEED */}
      <section>
        <h2 className="mb-3 font-mono text-[10px] font-semibold uppercase tracking-[0.15em] text-text-muted">
          Your Feed
        </h2>
        <div className="flex flex-col gap-2">
          {/* Main card */}
          <div className="rounded-[var(--radius)] border border-border bg-bg-card p-3 transition-colors hover:bg-bg-card-hover">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-text-primary">
              Title of Something
            </h3>
            <p className="mt-1 text-[11px] leading-relaxed text-text-secondary">
              Something will show up here but not really sure what so I&apos;m going to just write or something idk
            </p>
          </div>
          {/* Two small cards */}
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-[var(--radius)] border border-border bg-bg-card p-3 transition-colors hover:bg-bg-card-hover">
              <p className="text-[11px] leading-relaxed text-text-secondary">
                Something will show up here but not really sure what so I&apos;m going to just write or s...
              </p>
            </div>
            <div className="rounded-[var(--radius)] border border-border bg-bg-card p-3 transition-colors hover:bg-bg-card-hover">
              <p className="text-[11px] leading-relaxed text-text-secondary">
                Something will show up here but not really sure what so I&apos;m going to just write or s...
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Section: SOMETHING ELSE */}
      <section>
        <h2 className="mb-3 font-mono text-[10px] font-semibold uppercase tracking-[0.15em] text-text-muted">
          Something Else
        </h2>
        <div className="grid grid-cols-2 gap-2">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-16 rounded-[var(--radius)] border border-border bg-bg-card transition-colors hover:bg-bg-card-hover"
            />
          ))}
        </div>
      </section>

      {/* Section: WHAT'S NEW */}
      <section>
        <h2 className="mb-3 font-mono text-[10px] font-semibold uppercase tracking-[0.15em] text-text-muted">
          What&apos;s New
        </h2>
        <div className="grid grid-cols-2 gap-2">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-16 rounded-[var(--radius)] border border-border bg-bg-card transition-colors hover:bg-bg-card-hover"
            />
          ))}
        </div>
      </section>
    </div>
  );
}
