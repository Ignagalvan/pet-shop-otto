export default function ProductsLoading() {
  return (
    <div className="mx-auto max-w-7xl animate-pulse px-4 py-7 sm:px-6 lg:px-8 lg:py-9">
      <div className="h-3 w-24 rounded bg-muted" />
      <div className="mt-3 h-9 w-48 rounded bg-muted" />
      <div className="mt-2 h-4 w-36 rounded bg-muted" />
      <div className="mt-7 h-20 rounded-2xl border bg-white" />
      <div className="mt-5 overflow-hidden rounded-2xl border bg-white">
        {Array.from({ length: 9 }).map((_, index) => (
          <div key={index} className="flex gap-5 border-b p-5 last:border-0">
            <div className="h-5 flex-1 rounded bg-muted" />
            <div className="h-5 w-24 rounded bg-muted" />
            <div className="h-5 w-16 rounded bg-muted" />
            <div className="h-5 w-28 rounded bg-muted" />
          </div>
        ))}
      </div>
    </div>
  )
}
