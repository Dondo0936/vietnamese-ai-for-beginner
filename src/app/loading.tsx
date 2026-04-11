export default function Loading() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-16">
      {/* Hero skeleton */}
      <div className="text-center mb-12">
        <div className="mx-auto h-8 w-64 animate-pulse rounded-lg bg-slate-200 mb-3" />
        <div className="mx-auto h-4 w-96 animate-pulse rounded bg-slate-200 mb-8" />
        <div className="mx-auto h-10 w-full max-w-xl animate-pulse rounded-lg bg-slate-200 mb-5" />
        <div className="flex items-center justify-center gap-2">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-8 w-20 animate-pulse rounded-full bg-slate-200"
            />
          ))}
        </div>
      </div>

      {/* Grid skeleton */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 9 }).map((_, i) => (
          <div
            key={i}
            className="rounded-lg border border-border bg-card p-4"
          >
            <div className="flex items-start gap-3">
              <div className="h-8 w-8 animate-pulse rounded-md bg-slate-200" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-3/4 animate-pulse rounded bg-slate-200" />
                <div className="h-3 w-1/2 animate-pulse rounded bg-slate-200" />
                <div className="flex gap-1.5 mt-3">
                  <div className="h-5 w-14 animate-pulse rounded-full bg-slate-200" />
                  <div className="h-5 w-16 animate-pulse rounded-full bg-slate-200" />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
