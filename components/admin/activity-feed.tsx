import Link from 'next/link'
import {
  Boxes,
  FileSpreadsheet,
  PackageSearch,
  Settings,
  ShoppingBag,
} from 'lucide-react'

export type ActivityItem = {
  id: number
  category: 'orders' | 'catalog' | 'stock' | 'imports' | 'settings'
  event_type: string
  entity_type: string | null
  entity_id: string | null
  title: string
  description: string | null
  metadata: Record<string, unknown>
  actor_name: string
  created_at: string
  total_count?: number
}

const categoryConfig = {
  orders: {
    label: 'Pedidos',
    icon: ShoppingBag,
    style: 'bg-primary/10 text-primary',
  },
  catalog: {
    label: 'Catálogo',
    icon: PackageSearch,
    style: 'bg-brown/10 text-brown',
  },
  stock: {
    label: 'Stock',
    icon: Boxes,
    style: 'bg-amber-100 text-amber-800',
  },
  imports: {
    label: 'Importaciones',
    icon: FileSpreadsheet,
    style: 'bg-success/10 text-success',
  },
  settings: {
    label: 'Configuración',
    icon: Settings,
    style: 'bg-muted text-muted-foreground',
  },
} satisfies Record<
  ActivityItem['category'],
  { label: string; icon: typeof ShoppingBag; style: string }
>

const dateTime = new Intl.DateTimeFormat('es-AR', {
  dateStyle: 'medium',
  timeStyle: 'short',
  timeZone: 'America/Argentina/Cordoba',
})

function activityHref(activity: ActivityItem) {
  if (activity.entity_type === 'product' && activity.entity_id) {
    return `/admin/productos/${activity.entity_id}`
  }
  if (activity.entity_type === 'order') return '/admin/pedidos'
  if (activity.entity_type === 'import_batch') return '/admin/importar'
  if (activity.entity_type === 'store_settings') return '/admin/configuracion'
  return null
}

export function ActivityFeed({
  activities,
  compact = false,
}: {
  activities: ActivityItem[]
  compact?: boolean
}) {
  return (
    <div className={compact ? 'divide-y' : 'space-y-3'}>
      {activities.map((activity) => {
        const config = categoryConfig[activity.category]
        const Icon = config.icon
        const href = activityHref(activity)
        const content = (
          <>
            <div
              className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${config.style}`}
            >
              <Icon className="size-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <p className="font-extrabold">{activity.title}</p>
                {!compact ? (
                  <span className="rounded-full bg-background px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-muted-foreground">
                    {config.label}
                  </span>
                ) : null}
              </div>
              {activity.description ? (
                <p className="mt-1 text-sm text-muted-foreground">
                  {activity.description}
                </p>
              ) : null}
              <p className="mt-2 text-xs text-muted-foreground">
                {dateTime.format(new Date(activity.created_at))} ·{' '}
                {activity.actor_name}
              </p>
            </div>
          </>
        )

        if (href) {
          return (
            <Link
              key={activity.id}
              href={href}
              className={`flex items-start gap-3 transition hover:bg-primary/[0.025] ${
                compact
                  ? 'p-4 sm:px-5'
                  : 'rounded-2xl border bg-white p-4 shadow-sm hover:border-primary/25'
              }`}
            >
              {content}
            </Link>
          )
        }

        return (
          <article
            key={activity.id}
            className={`flex items-start gap-3 ${
              compact
                ? 'p-4 sm:px-5'
                : 'rounded-2xl border bg-white p-4 shadow-sm'
            }`}
          >
            {content}
          </article>
        )
      })}
    </div>
  )
}
