import { useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '../../lib/utils'

const PLACEHOLDER = 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1200&q=80'
const DEFAULT_INTERVAL = 4000

function normalizePhotos(photos) {
  const sorted = [...photos].sort((a, b) => (a.display_order || 0) - (b.display_order || 0))
  return sorted.length ? sorted.map((p) => (typeof p === 'string' ? p : p.url)) : [PLACEHOLDER]
}

export default function PhotoCarousel({
  photos = [],
  autoPlay = true,
  interval = DEFAULT_INTERVAL,
  showArrows = true,
  showDots = true,
  compact = false,
  startDelay = 0,
  className,
  aspectClass = 'aspect-[16/10] sm:aspect-[16/9]',
  altPrefix = 'Photo',
}) {
  const images = normalizePhotos(photos)
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)

  useEffect(() => {
    setIndex(0)
  }, [photos])

  useEffect(() => {
    if (!autoPlay || images.length <= 1 || paused) return undefined

    let intervalId
    const startTimer = setTimeout(() => {
      intervalId = setInterval(() => {
        setIndex((i) => (i + 1) % images.length)
      }, interval)
    }, startDelay)

    return () => {
      clearTimeout(startTimer)
      if (intervalId) clearInterval(intervalId)
    }
  }, [autoPlay, images.length, paused, interval, startDelay])

  function prev(e) {
    e?.stopPropagation()
    setIndex((i) => (i === 0 ? images.length - 1 : i - 1))
  }

  function next(e) {
    e?.stopPropagation()
    setIndex((i) => (i === images.length - 1 ? 0 : i + 1))
  }

  function goTo(i, e) {
    e?.stopPropagation()
    setIndex(i)
  }

  return (
    <div
      className={cn('relative overflow-hidden rounded-xl bg-background', className)}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <div className={cn('relative', aspectClass)}>
        {images.map((url, i) => (
          <img
            key={`${url}-${i}`}
            src={url}
            alt={`${altPrefix} ${i + 1}`}
            className={cn(
              'absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ease-in-out',
              i === index ? 'opacity-100' : 'opacity-0'
            )}
            loading={i === 0 ? 'eager' : 'lazy'}
            draggable={false}
          />
        ))}
      </div>

      {images.length > 1 && showArrows && (
        <>
          <button
            type="button"
            onClick={prev}
            className="absolute left-3 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/90 p-2 shadow-md hover:bg-white"
            aria-label="Previous photo"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            type="button"
            onClick={next}
            className="absolute right-3 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/90 p-2 shadow-md hover:bg-white"
            aria-label="Next photo"
          >
            <ChevronRight size={20} />
          </button>
        </>
      )}

      {images.length > 1 && showDots && (
        <div
          className={cn(
            'absolute left-1/2 z-10 flex -translate-x-1/2 gap-1.5',
            compact ? 'bottom-2' : 'bottom-3'
          )}
        >
          {images.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={(e) => goTo(i, e)}
              className={cn(
                'rounded-full transition-all',
                compact ? 'h-1.5' : 'h-2',
                i === index
                  ? cn(compact ? 'w-4 bg-accent' : 'w-6 bg-accent')
                  : cn(compact ? 'w-1.5 bg-white/70' : 'w-2 bg-white/70')
              )}
              aria-label={`Go to photo ${i + 1}`}
              aria-current={i === index ? 'true' : undefined}
            />
          ))}
        </div>
      )}
    </div>
  )
}
