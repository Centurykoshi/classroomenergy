export function ClassroomSkeletonGrid() {
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
      {[0, 1, 2, 3, 4, 5].map((idx) => (
        <div key={idx} className="rounded-xl border bg-card p-6">
          <div className="h-5 w-1/2 animate-pulse rounded bg-muted" />
          <div className="mt-4 h-3 w-3/4 animate-pulse rounded bg-muted" />
          <div className="mt-8 h-9 w-full animate-pulse rounded bg-muted" />
          <div className="mt-3 h-9 w-full animate-pulse rounded bg-muted" />
          <div className="mt-6 h-20 w-full animate-pulse rounded bg-muted" />
        </div>
      ))}
    </div>
  );
}
