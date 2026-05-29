import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

const PLACEHOLDER = 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1200&q=80'

export default function PhotoCarousel({ photos = [] }) {
  const sorted = [...photos].sort((a, b) => (a.display_order || 0) - (b.display_order || 0))
  const images = sorted.length ? sorted.map((p) => p.url) : [PLACEHOLDER]
  const [index, setIndex] = useState(0)

  function prev() {
    setIndex((i) => (i === 0 ? images.length - 1 : i - 1))
  }

  function next() {
    setIndex((i) => (i === images.length - 1 ? 0 : i + 1))
  }

  return (
    <div className="relative overflow-hidden rounded-xl bg-background">
      <div className="aspect-[16/10] sm:aspect-[16/9]">
        <img
          src={images[index]}
          alt={`Photo ${index + 1}`}
          className="h-full w-full object-cover"
        />
      </div>
      {images.length > 1 && (
        <>
          <button
            onClick={prev}
            className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-2 shadow-md hover:bg-white"
            aria-label="Previous photo"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            onClick={next}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-2 shadow-md hover:bg-white"
            aria-label="Next photo"
          >
            <ChevronRight size={20} />
          </button>
          <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
            {images.map((_, i) => (
              <button
                key={i}
                onClick={() => setIndex(i)}
                className={`h-2 rounded-full transition-all ${
                  i === index ? 'w-6 bg-accent' : 'w-2 bg-white/70'
                }`}
                aria-label={`Go to photo ${i + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
