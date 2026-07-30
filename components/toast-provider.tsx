'use client'

import { createContext, useCallback, useContext, useState } from 'react'
import { Check, Info, X, TriangleAlert } from 'lucide-react'
import { cn } from '@/lib/utils'

type ToastVariant = 'success' | 'error' | 'info' | 'warning'

interface Toast {
  id: number
  message: string
  variant: ToastVariant
}

interface ToastContextValue {
  toast: (message: string, variant?: ToastVariant) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const toast = useCallback((message: string, variant: ToastVariant = 'success') => {
    const id = Date.now() + Math.random()
    setToasts((prev) => [...prev, { id, message, variant }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 2500)
  }, [])

  const remove = (id: number) => setToasts((prev) => prev.filter((t) => t.id !== id))

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div
        className="pointer-events-none fixed inset-x-0 bottom-20 z-[100] flex flex-col items-center gap-2 px-4 sm:bottom-6 sm:right-6 sm:left-auto sm:items-end"
        aria-live="polite"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            className="pointer-events-auto flex w-auto max-w-[calc(100vw-2rem)] items-center gap-2.5 rounded-full border border-border bg-card px-3 py-2 shadow-lg animate-in slide-in-from-top-2 fade-in sm:slide-in-from-bottom-2"
          >
            <span
              className={cn(
                'flex size-7 shrink-0 items-center justify-center rounded-full',
                t.variant === 'success' && 'bg-success/15 text-success',
                t.variant === 'error' && 'bg-destructive/15 text-destructive',
                t.variant === 'info' && 'bg-brand/15 text-brand',
                t.variant === 'warning' && 'bg-amber-100 text-amber-700',
              )}
            >
              {t.variant === 'success' && <Check className="size-4" />}
              {t.variant === 'error' && <TriangleAlert className="size-4" />}
              {t.variant === 'info' && <Info className="size-4" />}
              {t.variant === 'warning' && <TriangleAlert className="size-4" />}
            </span>
            <p className="text-sm font-bold leading-snug text-card-foreground">
              {t.message}
            </p>
            <button
              onClick={() => remove(t.id)}
              className="shrink-0 rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              aria-label="Cerrar notificación"
            >
              <X className="size-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}
