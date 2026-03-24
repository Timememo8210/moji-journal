'use client'

export function SkeletonCard({ hasImage = true }: { hasImage?: boolean }) {
  return (
    <div className="rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden animate-pulse">
      {hasImage && (
        <div className="aspect-[16/9] bg-gray-100 dark:bg-gray-800" />
      )}
      <div className="p-5 space-y-3">
        <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded-full w-24" />
        <div className="h-5 bg-gray-100 dark:bg-gray-800 rounded-full w-48" />
        <div className="space-y-2">
          <div className="h-3.5 bg-gray-50 dark:bg-gray-800/50 rounded-full w-full" />
          <div className="h-3.5 bg-gray-50 dark:bg-gray-800/50 rounded-full w-3/4" />
        </div>
      </div>
    </div>
  )
}

export function SkeletonList() {
  return (
    <div className="space-y-6">
      <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded-full w-20 mb-6" />
      <SkeletonCard hasImage={true} />
      <SkeletonCard hasImage={false} />
      <SkeletonCard hasImage={true} />
    </div>
  )
}

export function SkeletonDetail() {
  return (
    <div className="animate-pulse max-w-journal mx-auto px-6 py-8">
      <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded-full w-40 mb-4" />
      <div className="h-7 bg-gray-100 dark:bg-gray-800 rounded-full w-64 mb-8" />
      <div className="aspect-[16/9] bg-gray-100 dark:bg-gray-800 rounded-2xl mb-8" />
      <div className="space-y-3">
        <div className="h-4 bg-gray-50 dark:bg-gray-800/50 rounded-full w-full" />
        <div className="h-4 bg-gray-50 dark:bg-gray-800/50 rounded-full w-full" />
        <div className="h-4 bg-gray-50 dark:bg-gray-800/50 rounded-full w-5/6" />
        <div className="h-4 bg-gray-50 dark:bg-gray-800/50 rounded-full w-full" />
        <div className="h-4 bg-gray-50 dark:bg-gray-800/50 rounded-full w-2/3" />
      </div>
    </div>
  )
}
