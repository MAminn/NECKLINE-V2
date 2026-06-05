export default function ProductSkeleton() {
  return (
    <div className="flex flex-col overflow-hidden rounded-lg border border-border bg-surface">
      <div className="aspect-square animate-pulse bg-white/[0.04]" />
      <div className="flex flex-col gap-2 p-4">
        <div className="h-2 w-14 animate-pulse rounded bg-white/[0.06]" />
        <div className="h-4 w-3/4 animate-pulse rounded bg-white/[0.07]" />
        <div className="mt-3 flex items-center justify-between">
          <div className="h-5 w-20 animate-pulse rounded bg-white/[0.06]" />
          <div className="h-7 w-16 animate-pulse rounded bg-white/[0.06]" />
        </div>
      </div>
    </div>
  );
}
