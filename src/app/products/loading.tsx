export default function Loading() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-baseline justify-between mb-6">
        <div className="h-9 w-40 rounded bg-muted animate-pulse" />
        <div className="h-4 w-32 rounded bg-muted animate-pulse" />
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        <aside className="w-full lg:w-64 space-y-6">
          <div className="space-y-3">
            <div className="h-5 w-28 rounded bg-muted animate-pulse" />
            <div className="space-y-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-4 w-full rounded bg-muted animate-pulse" />
              ))}
            </div>
          </div>
          <div className="h-px w-full bg-border" />
          <div className="space-y-3">
            <div className="h-5 w-28 rounded bg-muted animate-pulse" />
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-4 w-3/4 rounded bg-muted animate-pulse" />
              ))}
            </div>
          </div>
        </aside>

        <div className="flex-1">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className="overflow-hidden rounded-lg border bg-card">
                <div className="aspect-[3/4] w-full bg-muted animate-pulse" />
                <div className="space-y-2 p-4">
                  <div className="h-4 w-3/4 rounded bg-muted animate-pulse" />
                  <div className="h-4 w-1/2 rounded bg-muted animate-pulse" />
                  <div className="h-5 w-1/3 rounded bg-muted animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

