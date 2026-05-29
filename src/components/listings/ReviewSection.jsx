import { useState, useEffect } from 'react'
import { Star } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import Button from '../ui/Button'
import { Textarea } from '../ui/Input'

export default function ReviewSection({ listingId }) {
  const { user, profile } = useAuth()
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    async function fetchReviews() {
      const { data } = await supabase
        .from('reviews')
        .select('id, rating, comment, created_at, student:profiles(full_name)')
        .eq('listing_id', listingId)
        .order('created_at', { ascending: false })
      setReviews(data || [])
      setLoading(false)
    }
    fetchReviews()
  }, [listingId])

  async function handleSubmit(e) {
    e.preventDefault()
    if (!user || profile?.role !== 'student') return
    setSubmitting(true)
    setError('')
    try {
      const { error: insertError } = await supabase.from('reviews').insert({
        listing_id: listingId,
        student_id: user.id,
        rating,
        comment: comment.trim() || null,
      })
      if (insertError) throw insertError
      setComment('')
      setRating(5)
      const { data } = await supabase
        .from('reviews')
        .select('id, rating, comment, created_at, student:profiles(full_name)')
        .eq('listing_id', listingId)
        .order('created_at', { ascending: false })
      setReviews(data || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const avgRating =
    reviews.length > 0
      ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
      : null

  return (
    <div>
      <div className="mb-6 flex items-center gap-3">
        <h2 className="font-display text-xl font-semibold">Reviews</h2>
        {avgRating && (
          <span className="flex items-center gap-1 text-sm text-muted">
            <Star size={16} className="fill-accent text-accent" />
            {avgRating} ({reviews.length})
          </span>
        )}
      </div>

      {user && profile?.role === 'student' && (
        <form onSubmit={handleSubmit} className="mb-8 rounded-xl border border-border bg-surface p-4">
          <p className="mb-2 text-sm font-medium">Your rating</p>
          <div className="mb-3 flex gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setRating(n)}
                className="p-0.5"
              >
                <Star
                  size={24}
                  className={n <= rating ? 'fill-accent text-accent' : 'text-border'}
                />
              </button>
            ))}
          </div>
          <Textarea
            placeholder="Share your experience (optional)"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
          {error && <p className="mt-2 text-sm text-error">{error}</p>}
          <Button type="submit" className="mt-3" disabled={submitting}>
            {submitting ? 'Submitting...' : 'Submit review'}
          </Button>
        </form>
      )}

      {loading ? (
        <p className="text-sm text-muted">Loading reviews...</p>
      ) : reviews.length === 0 ? (
        <p className="text-sm text-muted">No reviews yet. Be the first to review this listing.</p>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <div key={review.id} className="rounded-xl border border-border bg-surface p-4">
              <div className="flex items-center justify-between">
                <p className="font-medium">{review.student?.full_name || 'Student'}</p>
                <div className="flex gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      size={14}
                      className={i < review.rating ? 'fill-accent text-accent' : 'text-border'}
                    />
                  ))}
                </div>
              </div>
              {review.comment && <p className="mt-2 text-sm text-muted">{review.comment}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
