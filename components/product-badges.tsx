import { cn } from '@/lib/utils'
import type { ProductTag, StockStatus } from '@/lib/types'

const tagStyles: Record<ProductTag, { label: string; className: string }> = {
  oferta: { label: 'Oferta', className: 'bg-promo text-promo-foreground' },
  nuevo: { label: 'Nuevo', className: 'bg-brand text-primary-foreground' },
  'mas-vendido': { label: 'Más vendido', className: 'bg-brown text-brown-foreground' },
  ultimas: { label: 'Últimas unidades', className: 'bg-amber-500 text-white' },
}

export function ProductTagBadge({ tag }: { tag: ProductTag }) {
  const s = tagStyles[tag]
  return (
    <span
      className={cn(
        'rounded-full px-2.5 py-1 text-[11px] font-bold leading-none shadow-sm',
        s.className,
      )}
    >
      {s.label}
    </span>
  )
}

const stockStyles: Record<
  StockStatus,
  { label: string; dot: string; text: string }
> = {
  disponible: { label: 'En stock', dot: 'bg-success', text: 'text-success' },
  poco: { label: 'Pocas unidades', dot: 'bg-amber-500', text: 'text-amber-600' },
  agotado: { label: 'Sin stock', dot: 'bg-destructive', text: 'text-destructive' },
  pedido: { label: 'Disponible a pedido', dot: 'bg-brand', text: 'text-brand' },
}

export function StockBadge({
  status,
  count,
}: {
  status: StockStatus
  count?: number
}) {
  const s = stockStyles[status]
  return (
    <span className={cn('inline-flex items-center gap-1.5 text-xs font-semibold', s.text)}>
      <span className={cn('size-2 rounded-full', s.dot)} aria-hidden />
      {status === 'poco' && count ? `¡Quedan ${count}!` : s.label}
    </span>
  )
}
