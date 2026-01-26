export default function Loading() {
  return (
    <main className="container mx-auto px-4 py-12">
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="h-10 w-48 rounded bg-muted animate-pulse" />
        <div className="space-y-3">
          <div className="h-4 w-full rounded bg-muted animate-pulse" />
          <div className="h-4 w-5/6 rounded bg-muted animate-pulse" />
          <div className="h-4 w-2/3 rounded bg-muted animate-pulse" />
        </div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
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
    </main>
  );
}

