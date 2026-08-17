import { useState, useEffect, useCallback } from 'react'
import { Star, Trash2, Pencil } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { isDatabaseListingId } from '../../data/webRentals'
import { useAuth } from '../../hooks/useAuth'
import { useTranslation } from '../../hooks/useTranslation'
import Button from '../ui/Button'
import { Textarea } from '../ui/Input'

export default function ReviewSection({ listingId }) {
  const { user, profile } = useAuth()
  const { t } = useTranslation()
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [editRating, setEditRating] = useState(5)
  const [editComment, setEditComment] = useState('')

  const fetchReviews = useCallback(async () => {
    if (!isDatabaseListingId(listingId)) {
      setReviews([])
      setLoading(false)
      return
    }
    const { data } = await supabase
      .from('reviews')
      .select('id, rating, comment, created_at, student_id, student:profiles(full_name)')
      .eq('listing_id', listingId)
      .order('created_at', { ascending: false })
    setReviews(data || [])
    setLoading(false)
  }, [listingId])

  useEffect(() => {
    fetchReviews()
  }, [fetchReviews])

  useEffect(() => {
    if (!isDatabaseListingId(listingId)) return undefined
    const channel = supabase
      .channel(`reviews-${listingId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reviews', filter: `listing_id=eq.${listingId}` }, fetchReviews)
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [listingId, fetchReviews])

  const myReview = reviews.find((r) => r.student_id === user?.id)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!user || profile?.role !== 'student' || myReview) return
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
      fetchReviews()
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  async function handleUpdate(reviewId) {
    setSubmitting(true)
    setError('')
    try {
      const { error: updateError } = await supabase
        .from('reviews')
        .update({ rating: editRating, comment: editComment.trim() || null })
        .eq('id', reviewId)
        .eq('student_id', user.id)
      if (updateError) throw updateError
      setEditingId(null)
      fetchReviews()
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(reviewId) {
    if (!confirm(t('reviews.deleteConfirm'))) return
    const { error: deleteError } = await supabase.from('reviews').delete().eq('id', reviewId).eq('student_id', user.id)
    if (deleteError) setError(deleteError.message)
    else fetchReviews()
  }

  const avgRating =
    reviews.length > 0
      ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
      : null

  return (
    <div>
      <div className="mb-6 flex items-center gap-3">
        <h2 className="font-display text-xl font-semibold">{t('reviews.title')}</h2>
        {avgRating && (
          <span className="flex items-center gap-1 text-sm text-muted">
            <Star size={16} className="fill-accent text-accent" />
            {avgRating} ({reviews.length})
          </span>
        )}
      </div>

      {user && profile?.role === 'student' && !myReview && (
        <form onSubmit={handleSubmit} className="mb-8 rounded-xl border border-border bg-surface p-4">
          <p className="mb-2 text-sm font-medium">{t('reviews.yourRating')}</p>
          <div className="mb-3 flex gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} type="button" onClick={() => setRating(n)} className="p-0.5">
                <Star size={24} className={n <= rating ? 'fill-accent text-accent' : 'text-border'} />
              </button>
            ))}
          </div>
          <Textarea
            placeholder={t('reviews.commentPlaceholder')}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
          {error && <p className="mt-2 text-sm text-error">{error}</p>}
          <Button type="submit" className="mt-3" disabled={submitting}>
            {submitting ? t('reviews.submitting') : t('reviews.submit')}
          </Button>
        </form>
      )}

      {loading ? (
        <p className="text-sm text-muted">{t('reviews.loading')}</p>
      ) : reviews.length === 0 ? (
        <p className="text-sm text-muted">{t('reviews.empty')}</p>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <div key={review.id} className="rounded-xl border border-border bg-surface p-4">
              {editingId === review.id ? (
                <div className="space-y-3">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button key={n} type="button" onClick={() => setEditRating(n)} className="p-0.5">
                        <Star size={20} className={n <= editRating ? 'fill-accent text-accent' : 'text-border'} />
                      </button>
                    ))}
                  </div>
                  <Textarea value={editComment} onChange={(e) => setEditComment(e.target.value)} />
                  <div className="flex gap-2">
                    <Button size="sm" disabled={submitting} onClick={() => handleUpdate(review.id)}>{t('reviews.save')}</Button>
                    <Button size="sm" variant="outline" onClick={() => setEditingId(null)}>{t('reviews.cancel')}</Button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-medium">{review.student?.full_name || t('housing.student')}</p>
                    <div className="flex items-center gap-2">
                      <div className="flex gap-0.5">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star key={i} size={14} className={i < review.rating ? 'fill-accent text-accent' : 'text-border'} />
                        ))}
                      </div>
                      {review.student_id === user?.id && (
                        <div className="flex gap-1">
                          <button
                            type="button"
                            className="rounded p-1 text-muted hover:text-primary"
                            onClick={() => {
                              setEditingId(review.id)
                              setEditRating(review.rating)
                              setEditComment(review.comment || '')
                            }}
                          >
                            <Pencil size={14} />
                          </button>
                          <button type="button" className="rounded p-1 text-muted hover:text-error" onClick={() => handleDelete(review.id)}>
                            <Trash2 size={14} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                  {review.comment && <p className="mt-2 text-sm text-muted">{review.comment}</p>}
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
