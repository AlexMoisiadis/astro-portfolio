export default function PhotoLoading() {
  return (
    <div className="animate-fade-in">
      {/* Back button skeleton */}
      <div className="mb-6 flex items-center gap-2">
        <div className="animate-shimmer h-4 w-4 rounded bg-neutral-800/60" />
        <div className="animate-shimmer h-4 w-28 rounded bg-neutral-800/60" />
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* Image skeleton */}
        <div className="lg:col-span-8">
          <div className="animate-shimmer aspect-[3/2] w-full rounded-lg bg-neutral-800/60" />
        </div>

        {/* Sidebar skeleton */}
        <div className="lg:col-span-4">
          <div className="space-y-6">
            {/* Title */}
            <div className="space-y-3">
              <div className="animate-shimmer h-8 w-3/4 rounded bg-neutral-800/60" />
              <div className="animate-shimmer h-4 w-1/3 rounded bg-neutral-800/40" />
            </div>

            {/* Tech panel skeleton */}
            <div className="rounded-lg border border-white/10 bg-white/[0.03] p-5 space-y-4">
              {/* Description lines */}
              <div className="space-y-2">
                <div className="animate-shimmer h-3.5 w-full rounded bg-neutral-800/50" />
                <div className="animate-shimmer h-3.5 w-5/6 rounded bg-neutral-800/50" />
                <div className="animate-shimmer h-3.5 w-2/3 rounded bg-neutral-800/50" />
              </div>

              {/* Section header */}
              <div className="animate-shimmer h-3 w-36 rounded bg-neutral-800/40" />

              {/* Metadata rows */}
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="animate-shimmer h-3.5 w-3.5 shrink-0 rounded bg-neutral-800/50" />
                  <div className="animate-shimmer h-3.5 w-20 shrink-0 rounded bg-neutral-800/40" />
                  <div
                    className="animate-shimmer h-3.5 rounded bg-neutral-800/50"
                    style={{ width: `${40 + Math.round(i * 12) % 50}%` }}
                  />
                </div>
              ))}
            </div>

            {/* Download button skeleton */}
            <div className="animate-shimmer h-10 w-full rounded-lg border border-white/10 bg-white/[0.03]" />
          </div>
        </div>
      </div>
    </div>
  );
}
