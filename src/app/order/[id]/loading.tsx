export default function Loading() {
  return (
    <main className="mx-auto max-w-2xl space-y-6 p-6">
      <div className="space-y-2">
        <div className="h-8 w-56 rounded bg-muted animate-pulse" />
        <div className="h-4 w-64 rounded bg-muted animate-pulse" />
      </div>

      <div className="rounded border bg-card p-4 space-y-3">
        <div className="h-5 w-40 rounded bg-muted animate-pulse" />
        <div className="h-4 w-full rounded bg-muted animate-pulse" />
        <div className="h-4 w-5/6 rounded bg-muted animate-pulse" />
      </div>

      <div className="rounded border bg-card p-4 space-y-4">
        <div className="h-5 w-20 rounded bg-muted animate-pulse" />
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1 space-y-2">
                <div className="h-4 w-3/4 rounded bg-muted animate-pulse" />
                <div className="h-4 w-1/2 rounded bg-muted animate-pulse" />
              </div>
              <div className="h-4 w-16 rounded bg-muted animate-pulse" />
            </div>
          ))}
        </div>
        <div className="h-px w-full bg-border" />
        <div className="flex items-center justify-between">
          <div className="h-4 w-16 rounded bg-muted animate-pulse" />
          <div className="h-4 w-20 rounded bg-muted animate-pulse" />
        </div>
      </div>
    </main>
  );
}

