import { useState, useEffect, useCallback } from 'react'
import { Star, Trash2 } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useTranslation } from '../../hooks/useTranslation'
import Button from '../ui/Button'
import Card from '../ui/Card'

export default function AdminReviewsPanel() {
  const { t } = useTranslation()
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState(null)

  const fetchReviews = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from('reviews')
      .select(`
        id, rating, comment, created_at,
        student:profiles!reviews_student_id_fkey(full_name),
        listing:listings(id, title, area, city)
      `)
      .order('created_at', { ascending: false })
      .limit(100)
    setReviews(data || [])
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchReviews()
  }, [fetchReviews])

  useEffect(() => {
    const channel = supabase
      .channel('admin-reviews')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reviews' }, fetchReviews)
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [fetchReviews])

  async function handleDelete(id) {
    if (!confirm(t('admin.deleteReviewConfirm'))) return
    setBusyId(id)
    try {
      await supabase.from('reviews').delete().eq('id', id)
      fetchReviews()
    } finally {
      setBusyId(null)
    }
  }

  if (loading) return <p className="text-sm text-muted">{t('common.loading')}</p>

  return (
    <div className="space-y-3">
      {reviews.length === 0 && <p className="text-sm text-muted">{t('admin.noReviews')}</p>}
      {reviews.map((review) => (
        <Card key={review.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="font-semibold text-primary">{review.listing?.title}</p>
            <p className="text-sm text-muted">{review.student?.full_name} · {review.listing?.area}, {review.listing?.city}</p>
            <div className="mt-2 flex gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} size={14} className={i < review.rating ? 'fill-accent text-accent' : 'text-border'} />
              ))}
            </div>
            {review.comment && <p className="mt-2 text-sm text-muted">{review.comment}</p>}
            <p className="mt-1 text-xs text-muted">{new Date(review.created_at).toLocaleString()}</p>
          </div>
          <Button size="sm" variant="danger" disabled={busyId === review.id} onClick={() => handleDelete(review.id)}>
            <Trash2 size={14} />
            {t('admin.deleteReview')}
          </Button>
        </Card>
      ))}
    </div>
  )
}
