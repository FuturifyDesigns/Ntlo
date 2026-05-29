import * as LucideIcons from 'lucide-react'
import { AMENITIES } from '../../lib/utils'

export default function AmenityChips({ amenities = [] }) {
  if (!amenities.length) return null

  return (
    <div className="flex flex-wrap gap-2">
      {amenities.map((id) => {
        const amenity = AMENITIES.find((a) => a.id === id)
        if (!amenity) return null
        const Icon = LucideIcons[amenity.icon] || LucideIcons.Check
        return (
          <span
            key={id}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-sm text-primary"
          >
            <Icon size={16} className="text-accent" />
            {amenity.label}
          </span>
        )
      })}
    </div>
  )
}
