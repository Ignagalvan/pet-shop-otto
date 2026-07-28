'use client'

import { useState } from 'react'
import { Heart } from 'lucide-react'
import { cn } from '@/lib/utils'

type FavoriteButtonProps = {
  active: boolean
  onToggle: () => void
  className?: string
  iconClassName?: string
}

export function FavoriteButton({
  active,
  onToggle,
  className,
  iconClassName,
}: FavoriteButtonProps) {
  const [burstId, setBurstId] = useState(0)

  function handleClick() {
    if (!active) setBurstId((current) => current + 1)
    onToggle()
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={active ? 'Quitar de favoritos' : 'Agregar a favoritos'}
      aria-pressed={active}
      className={cn(
        'favorite-button relative flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        className,
      )}
    >
      {burstId > 0 && (
        <span key={burstId} className="favorite-burst" aria-hidden="true">
          <span className="favorite-burst-ring" />
          <span className="favorite-burst-dot favorite-burst-dot-1" />
          <span className="favorite-burst-dot favorite-burst-dot-2" />
          <span className="favorite-burst-dot favorite-burst-dot-3" />
          <span className="favorite-burst-dot favorite-burst-dot-4" />
          <Heart className="favorite-burst-heart" />
        </span>
      )}
      <Heart
        className={cn(
          'relative z-10 transition-[color,fill,transform] duration-300',
          active ? 'scale-110 fill-promo text-promo' : 'text-muted-foreground',
          iconClassName,
        )}
      />
    </button>
  )
}
