import { z } from 'zod'

const publicSupabaseConfigSchema = z.object({
  url: z.url(),
  anonKey: z.string().min(20),
})

const adminSupabaseConfigSchema = publicSupabaseConfigSchema.extend({
  serviceRoleKey: z.string().min(20),
})

export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      (process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
  )
}

export function getPublicSupabaseConfig() {
  const parsed = publicSupabaseConfigSchema.safeParse({
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    anonKey:
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  })

  if (!parsed.success) {
    throw new Error(
      'Falta configurar NEXT_PUBLIC_SUPABASE_URL o NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.',
    )
  }

  return parsed.data
}

export function getAdminSupabaseConfig() {
  const publicConfig = getPublicSupabaseConfig()
  const parsed = adminSupabaseConfigSchema.safeParse({
    ...publicConfig,
    serviceRoleKey:
      process.env.SUPABASE_SECRET_KEY ??
      process.env.SUPABASE_SERVICE_ROLE_KEY,
  })

  if (!parsed.success) {
    throw new Error('Falta configurar SUPABASE_SECRET_KEY.')
  }

  return parsed.data
}
