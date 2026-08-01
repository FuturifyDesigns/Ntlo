import { useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '../../lib/utils'
import { getStorageImageVariants, CARD_IMAGE_OPTS, DETAIL_IMAGE_OPTS } from '../../lib/storageImages'

const DEFAULT_INTERVAL = 3500
const CARD_INTERVAL = 3000

function hasRealUrl(url) {
  return typeof url === 'string' && /^https?:\/\//i.test(url.trim())
}

function normalizePhotos(photos, compact) {
  if (!photos) return []
  const list = Array.isArray(photos) ? photos : [photos]
  const sorted = [...list].sort((a, b) => (a.display_order || 0) - (b.display_order || 0))
  const imageOpts = compact ? CARD_IMAGE_OPTS : DETAIL_IMAGE_OPTS
  return sorted
    .map((p) => {
      const url = typeof p === 'string' ? p : p?.url
      if (!hasRealUrl(url)) return null
      return getStorageImageVariants(url, imageOpts)
    })
    .filter(Boolean)
}

function CoverPlaceholder({ title, subtitle, compact }) {
  return (
    <div
      className="absolute inset-0 flex flex-col items-center justify-center px-4 text-center bg-[linear-gradient(145deg,#1A1A2E_0%,#2a2a45_42%,#3d3420_100%)]"
      aria-hidden
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-30"
        style={{
          backgroundImage:
            'radial-gradient(circle at 20% 20%, rgba(200,168,75,0.35), transparent 42%), radial-gradient(circle at 80% 70%, rgba(226,201,126,0.2), transparent 40%)',
        }}
      />
      <p
        className={cn(
          'relative z-[1] max-w-[90%] font-display font-semibold leading-snug text-white',
          compact ? 'text-sm sm:text-base' : 'text-lg sm:text-2xl'
        )}
      >
        {title || 'Student room'}
      </p>
      {subtitle ? (
        <p className={cn('relative z-[1] mt-1.5 text-white/75', compact ? 'text-[11px]' : 'text-sm')}>
          {subtitle}
        </p>
      ) : null}
    </div>
  )
}

export default function PhotoCarousel({
  photos = [],
  autoPlay = true,
  interval,
  showArrows = true,
  showDots = true,
  compact = false,
  pauseOnHover = true,
  startDelay = 0,
  className,
  aspectClass = 'aspect-[16/10] sm:aspect-[16/9]',
  altPrefix = 'Photo',
  placeholderTitle,
  placeholderSubtitle,
}) {
  const slideInterval = interval ?? (compact ? CARD_INTERVAL : DEFAULT_INTERVAL)
  const images = normalizePhotos(photos, compact)
  const empty = images.length === 0
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const [fallbackSrc, setFallbackSrc] = useState({})

  useEffect(() => {
    setIndex(0)
    setFallbackSrc({})
  }, [photos])

  useEffect(() => {
    if (!autoPlay || images.length <= 1 || paused) return undefined

    let intervalId
    const startTimer = setTimeout(() => {
      intervalId = setInterval(() => {
        setIndex((i) => (i + 1) % images.length)
      }, slideInterval)
    }, startDelay)

    return () => {
      clearTimeout(startTimer)
      if (intervalId) clearInterval(intervalId)
    }
  }, [autoPlay, images.length, paused, slideInterval, startDelay])

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
      onMouseEnter={pauseOnHover ? () => setPaused(true) : undefined}
      onMouseLeave={pauseOnHover ? () => setPaused(false) : undefined}
      onFocus={pauseOnHover ? () => setPaused(true) : undefined}
      onBlur={pauseOnHover ? () => setPaused(false) : undefined}
    >
      <div className={cn('relative', aspectClass)}>
        {empty ? (
          <CoverPlaceholder
            title={placeholderTitle || altPrefix}
            subtitle={placeholderSubtitle}
            compact={compact}
          />
        ) : (
          images.map((image, i) => (
            <img
              key={`${image.fallback}-${i}`}
              src={fallbackSrc[i] || image.src}
              alt={`${altPrefix} ${i + 1}`}
              onError={() => {
                if (image.fallback && fallbackSrc[i] !== image.fallback) {
                  setFallbackSrc((prev) => ({ ...prev, [i]: image.fallback }))
                }
              }}
              className={cn(
                'absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ease-in-out',
                i === index ? 'opacity-100' : 'opacity-0'
              )}
              loading={i === 0 ? 'eager' : 'lazy'}
              draggable={false}
              referrerPolicy="no-referrer"
            />
          ))
        )}
      </div>

      {!empty && images.length > 1 && showArrows && (
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

      {!empty && images.length > 1 && showDots && (
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
