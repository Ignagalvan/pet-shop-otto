'use client'

import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { LoaderCircle, LockKeyhole } from 'lucide-react'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'

export function AdminLoginForm({ nextPath = '/admin' }: { nextPath?: string }) {
  const router = useRouter()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setLoading(true)

    const form = new FormData(event.currentTarget)
    const email = String(form.get('email') ?? '')
    const password = String(form.get('password') ?? '')
    const supabase = createSupabaseBrowserClient()
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (signInError) {
      setError('No pudimos iniciar sesión. Revisá el correo y la contraseña.')
      setLoading(false)
      return
    }

    // On a brand-new installation only, the first authenticated account can
    // claim the owner profile. The database function locks the table and
    // permanently rejects this operation after an owner exists.
    await supabase.rpc('claim_initial_owner', {
      p_full_name: 'Dueño de Pet Shop Otto',
    })

    router.replace(nextPath.startsWith('/admin') ? nextPath : '/admin')
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="mt-7 space-y-4">
      <label className="block">
        <span className="mb-1.5 block text-sm font-bold text-foreground">
          Correo
        </span>
        <input
          name="email"
          type="email"
          autoComplete="email"
          required
          className="h-12 w-full rounded-xl border bg-white px-4 outline-none transition focus:border-primary focus:ring-3 focus:ring-primary/15"
          placeholder="tu@correo.com"
        />
      </label>
      <label className="block">
        <span className="mb-1.5 block text-sm font-bold text-foreground">
          Contraseña
        </span>
        <input
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="h-12 w-full rounded-xl border bg-white px-4 outline-none transition focus:border-primary focus:ring-3 focus:ring-primary/15"
          placeholder="••••••••"
        />
      </label>
      {error && (
        <p role="alert" className="rounded-xl bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={loading}
        className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 font-bold text-white transition hover:bg-primary/90 disabled:opacity-60"
      >
        {loading ? <LoaderCircle className="size-5 animate-spin" /> : <LockKeyhole className="size-5" />}
        {loading ? 'Ingresando…' : 'Entrar al panel'}
      </button>
    </form>
  )
}
