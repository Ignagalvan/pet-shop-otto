'use client'

import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, LoaderCircle, LockKeyhole } from 'lucide-react'
import { isStaffRole } from '@/lib/admin-access'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'

export function AdminLoginForm({ nextPath = '/admin' }: { nextPath?: string }) {
  const router = useRouter()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setLoading(true)

    const form = new FormData(event.currentTarget)
    const email = String(form.get('email') ?? '').trim().toLowerCase()
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

    const { data: userData } = await supabase.auth.getUser()
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userData.user?.id ?? '')
      .maybeSingle()

    if (profileError || !isStaffRole(profile?.role)) {
      await supabase.auth.signOut()
      setError('Esta cuenta no tiene permiso para entrar al panel del negocio.')
      setLoading(false)
      return
    }

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
      <div>
        <label htmlFor="admin-password" className="mb-1.5 block text-sm font-bold text-foreground">
          Contraseña
        </label>
        <div className="relative">
          <input
            id="admin-password"
            name="password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            required
            className="h-12 w-full rounded-xl border bg-white pl-4 pr-14 outline-none transition focus:border-primary focus:ring-3 focus:ring-primary/15"
            placeholder="••••••••"
          />
          <button
            type="button"
            aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            aria-controls="admin-password"
            aria-pressed={showPassword}
            onClick={() => setShowPassword((visible) => !visible)}
            className="absolute inset-y-0 right-0 flex w-12 items-center justify-center rounded-r-xl text-muted-foreground hover:text-primary focus-visible:outline-2 focus-visible:outline-primary"
          >
            {showPassword ? <EyeOff className="size-5" aria-hidden="true" /> : <Eye className="size-5" aria-hidden="true" />}
          </button>
        </div>
      </div>
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
