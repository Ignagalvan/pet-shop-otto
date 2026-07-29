import 'server-only'

import { cache } from 'react'
import {
  getPublicSupabaseConfig,
  isSupabaseConfigured,
} from '@/lib/supabase/config'
import {
  DEFAULT_STORE_SETTINGS,
  parseStoreSettings,
} from '@/lib/store-settings'

export const getPublicStoreSettings = cache(async () => {
  if (!isSupabaseConfigured()) return DEFAULT_STORE_SETTINGS

  try {
    const { url, anonKey } = getPublicSupabaseConfig()
    const select =
      'instagram,whatsapp_number,address,email,business_hours,delivery_enabled,pickup_enabled,shipping_cost,free_shipping_threshold,payment_methods,closed_store_message'
    const response = await fetch(
      `${url}/rest/v1/store_settings?id=eq.true&select=${select}`,
      {
        headers: {
          apikey: anonKey,
          Authorization: `Bearer ${anonKey}`,
        },
        next: {
          revalidate: 60 * 60,
          tags: ['store-settings'],
        },
      },
    )

    if (!response.ok) return DEFAULT_STORE_SETTINGS
    const rows = (await response.json()) as unknown[]
    return parseStoreSettings(rows[0])
  } catch {
    return DEFAULT_STORE_SETTINGS
  }
})
