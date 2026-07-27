import { Star } from 'lucide-react'
import { cn } from '@/lib/utils'

export function StarRating({
  rating,
  size = 'sm',
  showValue = false,
  count,
}: {
  rating: number
  size?: 'sm' | 'md'
  showValue?: boolean
  count?: number
}) {
  const px = size === 'md' ? 'size-4' : 'size-3.5'
  return (
    <div className="flex items-center gap-1">
      <div className="flex" aria-label={`Calificación ${rating} de 5`}>
        {[1, 2, 3, 4, 5].map((i) => (
          <Star
            key={i}
            className={cn(
              px,
              i <= Math.round(rating)
                ? 'fill-amber-400 text-amber-400'
                : 'fill-muted text-muted-foreground/40',
            )}
          />
        ))}
      </div>
      {showValue && (
        <span className="text-xs font-semibold text-foreground">{rating.toFixed(1)}</span>
      )}
      {typeof count === 'number' && (
        <span className="text-xs text-muted-foreground">({count})</span>
      )}
    </div>
  )
}
