import 'server-only'

import { cache } from 'react'
import { redirect } from 'next/navigation'
import { isStaffRole } from '@/lib/admin-access'
import { createSupabaseServerClient } from './server'

export const requireStaff = cache(async function requireStaff() {
  const supabase = await createSupabaseServerClient()
  const { data: claimsData } = await supabase.auth.getClaims()
  const userId = claimsData?.claims?.sub

  if (!userId) redirect('/admin/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, full_name, role')
    .eq('id', userId)
    .maybeSingle()

  if (!isStaffRole(profile?.role)) redirect('/productos')

  return { supabase, user: { id: userId }, profile }
})
