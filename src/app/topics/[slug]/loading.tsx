export default function TopicLoading() {
  return (
    <div className="content-width px-5 py-10">
      {/* Back link skeleton */}
      <div className="mb-8 h-4 w-20 animate-pulse rounded bg-slate-200" />

      {/* Header skeleton */}
      <div className="mb-10">
        <div className="h-8 w-3/4 animate-pulse rounded-lg bg-slate-200 mb-2" />
        <div className="h-5 w-1/2 animate-pulse rounded bg-slate-200 mb-4" />
        <div className="flex gap-2">
          <div className="h-6 w-16 animate-pulse rounded-full bg-slate-200" />
          <div className="h-6 w-24 animate-pulse rounded-full bg-slate-200" />
        </div>
      </div>

      {/* Analogy section skeleton */}
      <div className="my-8">
        <div className="h-6 w-32 animate-pulse rounded bg-slate-200 mb-3" />
        <div className="rounded-lg bg-slate-100 p-4 space-y-2">
          <div className="h-4 w-full animate-pulse rounded bg-slate-200" />
          <div className="h-4 w-5/6 animate-pulse rounded bg-slate-200" />
          <div className="h-4 w-4/6 animate-pulse rounded bg-slate-200" />
        </div>
      </div>

      {/* Visualization skeleton */}
      <div className="my-8">
        <div className="h-6 w-28 animate-pulse rounded bg-slate-200 mb-3" />
        <div className="rounded-xl border border-border bg-card p-6">
          <div className="h-48 w-full animate-pulse rounded-lg bg-slate-200" />
        </div>
      </div>

      {/* Explanation skeleton */}
      <div className="my-8">
        <div className="h-6 w-24 animate-pulse rounded bg-slate-200 mb-3" />
        <div className="space-y-2">
          <div className="h-4 w-full animate-pulse rounded bg-slate-200" />
          <div className="h-4 w-full animate-pulse rounded bg-slate-200" />
          <div className="h-4 w-3/4 animate-pulse rounded bg-slate-200" />
          <div className="h-4 w-5/6 animate-pulse rounded bg-slate-200" />
        </div>
      </div>
    </div>
  );
}
