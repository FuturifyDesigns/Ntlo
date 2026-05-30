import { ChevronLeft, ChevronRight } from 'lucide-react'
import ListingCard from './ListingCard'
import { ListingGridSkeleton } from '../ui/Skeleton'
import Button from '../ui/Button'

export default function ListingGrid({
  listings,
  loading,
  error,
  count,
  page,
  setPage,
  pageSize,
  emptyMessage = 'No rooms found. Try different filters or check back soon.',
}) {
  const totalPages = Math.ceil(count / pageSize)

  if (loading && listings.length === 0) return <ListingGridSkeleton />

  if (error) {
    return (
      <div className="rounded-xl border border-error/20 bg-error/5 p-8 text-center">
        <p className="text-error">{error}</p>
        <p className="mt-2 text-sm text-muted">Check your connection or try again later.</p>
      </div>
    )
  }

  if (!listings.length) {
    return (
      <div className="rounded-xl border border-border bg-surface p-8 text-center sm:p-10">
        <p className="text-lg font-medium text-primary">{emptyMessage}</p>
        <p className="mt-2 text-sm text-muted">New listings are added regularly near campus.</p>
      </div>
    )
  }

  return (
    <div>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {listings.map((listing, i) => (
          <ListingCard key={listing.id} listing={listing} carouselIndex={i} />
        ))}
      </div>

      {totalPages > 1 && (
        <div className="mt-8 flex items-center justify-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
          >
            <ChevronLeft size={16} />
            Previous
          </Button>
          <span className="text-sm text-muted">
            Page {page + 1} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => p + 1)}
            disabled={page >= totalPages - 1}
          >
            Next
            <ChevronRight size={16} />
          </Button>
        </div>
      )}
    </div>
  )
}
