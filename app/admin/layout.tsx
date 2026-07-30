import type { ReactNode } from 'react'
import { AdminShell } from '@/components/admin/admin-shell'
import { createSupabaseServerClient } from '@/lib/supabase/server'

export default async function AdminLayout({
  children,
}: {
  children: ReactNode
}) {
  const supabase = await createSupabaseServerClient()
  const { data: claimsData } = await supabase.auth.getClaims()
  let newOrderCount = 0

  if (claimsData?.claims?.sub) {
    const { count } = await supabase
      .from('orders')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'pending')

    newOrderCount = count ?? 0
  }

  return (
    <AdminShell
      key={`new-orders-${newOrderCount}`}
      initialNewOrderCount={newOrderCount}
    >
      {children}
    </AdminShell>
  )
}
