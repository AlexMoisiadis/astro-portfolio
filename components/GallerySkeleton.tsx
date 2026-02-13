export default function GallerySkeleton() {
  return (
    <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <li key={i} className="overflow-hidden rounded-lg">
          <div className="animate-shimmer aspect-[4/3] w-full rounded-lg bg-neutral-800/60" />
          <div className="mt-3 space-y-2">
            <div className="animate-shimmer h-4 w-3/4 rounded bg-neutral-800/60" />
            <div className="animate-shimmer h-3 w-1/2 rounded bg-neutral-800/40" />
          </div>
        </li>
      ))}
    </ul>
  );
}
